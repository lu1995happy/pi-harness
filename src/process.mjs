import { spawn } from 'node:child_process';
import { executable } from './config.mjs';

export function run(name, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const file = executable(name);
    const child = spawn(file, args, { cwd: options.cwd, env: { ...process.env, ...options.env }, windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', exceeded = false;
    const max = options.maxBuffer ?? 4 * 1024 * 1024;
    const timer = setTimeout(() => child.kill(), options.timeout ?? 30000);
    const collect = (kind, data) => {
      if (kind === 'out') stdout += data; else stderr += data;
      if (stdout.length + stderr.length > max) { exceeded = true; child.kill(); }
    };
    child.stdout.on('data', d => collect('out', d)); child.stderr.on('data', d => collect('err', d));
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const result = { code, stdout: stdout.trim(), stderr: stderr.trim() };
      if ((code !== 0 || exceeded || signal) && !options.allowFailure) reject(new Error(`${name} ${args[0] || ''} failed (${signal || code}): ${stderr || stdout}`));
      else resolve(result);
    });
  });
}
export const git = async (cwd, ...args) => (await run('git', args, { cwd })).stdout;
export function quoteForShell(value, platform) {
  return "'" + String(value).replaceAll("'", platform === 'win32' ? "''" : "'\"'\"'") + "'";
}
export const shellQuote = value => quoteForShell(value, process.platform);
export function shellCommand(file, args = [], platform = process.platform) {
  return (platform === 'win32' ? '& ' : '') + [file, ...args].map(value => quoteForShell(value, platform)).join(' ');
}
