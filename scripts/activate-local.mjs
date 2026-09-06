#!/usr/bin/env node
// Register this owned source package globally for local development on any host.
// The macOS release installer remains the portable deployment path.
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {atomic,readJson} from '../src/store.mjs';
import {activationSettings} from './install-macos.mjs';

const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const agent=path.resolve(process.env.PI_CODING_AGENT_DIR||path.join(os.homedir(),'.pi','agent'));
const file=path.join(agent,'settings.json');
const installation=await readJson(path.join(agent,'harness','installation.json'),{});
await fs.access(path.join(source,'node_modules','@juicesharp','rpiv-ask-user-question','index.ts'));
const settings=await readJson(file,{});
const updated={...activationSettings(settings,source,installation.current),theme:'firstmate'};
await atomic(`${file}.backup-${Date.now()}`,settings);
await atomic(file,updated);
console.log(`Globally registered ${source}\nTheme: firstmate\nRestart existing Pi sessions; new plain pi launches load the harness from any directory.`);
