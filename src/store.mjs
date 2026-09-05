import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { harnessHome } from './config.mjs';

export function id(value) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(value)) throw new Error('IDs must be 1–64 lowercase letters, digits, underscores or hyphens');
  return value;
}
export const stateRoot = () => path.join(harnessHome(), 'state');
export const mapPath = mapId => path.join(stateRoot(), 'maps', `${id(mapId)}.json`);
export async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT' && fallback !== undefined) return fallback; throw e; }
}
export async function atomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
  await fs.rename(temp, file);
}
export async function locked(key, action) {
  const dir = path.join(stateRoot(), 'locks', `${id(key)}.lock`);
  await fs.mkdir(path.dirname(dir), { recursive: true });
  try { await fs.mkdir(dir); } catch (e) { if (e.code === 'EEXIST') throw new Error(`Operation already locked: ${key}. Inspect ${dir} before recovering a stale lock.`); throw e; }
  try { await fs.writeFile(path.join(dir, 'owner.json'), JSON.stringify({pid:process.pid,time:new Date().toISOString()})); return await action(); }
  finally { await fs.unlink(path.join(dir, 'owner.json')).catch(() => {}); await fs.rmdir(dir); }
}
export async function maps() {
  const dir = path.join(stateRoot(), 'maps');
  await fs.mkdir(dir, { recursive: true });
  return Promise.all((await fs.readdir(dir)).filter(n => n.endsWith('.json')).map(n => readJson(path.join(dir,n))));
}
export const loadMap = mapId => readJson(mapPath(mapId));
export const saveMap = map => atomic(mapPath(map.id), { ...map, updatedAt: new Date().toISOString() });
export async function event(mapId, workerId, kind, detail) {
  const entry = { id: randomUUID(), mapId: id(mapId), workerId: workerId ? id(workerId) : null, kind, detail, at: new Date().toISOString() };
  await atomic(path.join(stateRoot(), 'events', `${entry.id}.json`), entry);
  return entry;
}
export async function pendingEvents(mapIds) {
  const dir = path.join(stateRoot(), 'events'); await fs.mkdir(dir, {recursive:true});
  const rows = await Promise.all((await fs.readdir(dir)).filter(n=>n.endsWith('.json')).map(n=>readJson(path.join(dir,n))));
  const pending = [];
  for (const row of rows) if (mapIds.includes(row.mapId) && !(await readJson(path.join(stateRoot(),'outcomes',`${row.id}.json`), null))) pending.push(row);
  return pending.sort((a,b)=>a.at.localeCompare(b.at));
}
export const recordOutcome = outcome => atomic(path.join(stateRoot(),'outcomes',`${outcome.id}.json`), outcome);
