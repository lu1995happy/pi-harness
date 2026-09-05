#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/process.mjs';

export const annotationBindings = [
  ['prefix+a', 'annotate.capture', 'annotate text'],
  ['prefix+shift+a', 'annotate.copy-context', 'copy annotations as context'],
  ['prefix+m', 'annotate.manage', 'manage annotations'],
  ['prefix+o', 'annotate.open', 'review documents in this folder'],
  ['prefix+shift+o', 'annotate.last', "review the agent's last reply"],
];

export function addAnnotationBindings(content) {
  // Preserve unrelated TOML verbatim; refuse ambiguous occupied keys before writing.
  const blocks = [...content.matchAll(/^\s*\[\[keys\.command\]\][^\r\n]*\r?\n([^]*?)(?=^\s*\[|(?![^]))/gm)].map(match => match[1]);
  const field = (block, name) => block.match(new RegExp(`^\\s*${name}\\s*=\\s*["']([^"']+)["']`, 'm'))?.[1];
  let result = content;
  for (const [key, command, description] of annotationBindings) {
    if (blocks.some(block => field(block, 'command') === command && field(block, 'type') === 'plugin_action')) continue;
    if (blocks.some(block => field(block, 'key') === key)) throw new Error(`Existing Herdr binding occupies ${key}; config was not changed.`);
    result += `\n[[keys.command]]\nkey = ${JSON.stringify(key)}\ntype = "plugin_action"\ncommand = ${JSON.stringify(command)}\ndescription = ${JSON.stringify(description)}\n`;
  }
  return result;
}

async function install() {
  if (process.platform !== 'darwin') throw new Error('Run this installer on macOS. No files have been changed.');
  // Full upstream plugin needs Bun and Bash, including its native document-review build.
  for (const tool of ['herdr', 'bun', 'bash']) await run(tool, ['--version']);
  const configFile = path.resolve(process.env.HERDR_CONFIG_PATH || path.join(os.homedir(), '.config', 'herdr', 'config.toml'));
  let original = null;
  try { original = await fs.readFile(configFile, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const updated = addAnnotationBindings(original || '');
  await run('herdr', ['plugin', 'install', 'plannotator/herdr-annotate', '--ref', 'bccf884b874f5f39ccbef1bb6ac67625c5fb5d54', '--yes'], {timeout: 180000});
  await fs.mkdir(path.dirname(configFile), {recursive: true});
  if (updated !== original) {
    if (original !== null) await fs.copyFile(configFile, `${configFile}.before-annotate-${Date.now()}`);
    await fs.writeFile(configFile, updated);
    try { await run('herdr', ['config', 'check'], {env: {HERDR_CONFIG_PATH: configFile}}); }
    catch (error) {
      if (original === null) await fs.unlink(configFile); else await fs.writeFile(configFile, original);
      throw new Error(`Herdr rejected annotation config; original restored. ${error.message}`);
    }
  }
  console.log((await run('herdr', ['plugin', 'list', '--plugin', 'annotate', '--json'])).stdout);
  console.log(`Full annotation plugin installed. Five bindings configured in ${configFile}.`);
  console.log('In your running Herdr session, run: herdr server reload-config');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  install().catch(error => { console.error(error.message); process.exitCode = 1; });
}
