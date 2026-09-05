import fs from 'node:fs/promises';
import path from 'node:path';
import { git } from './process.mjs';

export async function repositoryIdentity(cwd) {
  // Common Git directory identifies the repository across subdirectories and worktrees.
  const common = await git(cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  const canonical = await fs.realpath(path.resolve(cwd, common));
  return process.platform === 'win32' ? canonical.toLowerCase() : canonical;
}

export async function mapsForRepository(all, cwd) {
  let current;
  try { current = await repositoryIdentity(cwd); } catch { return []; }
  const selected = [];
  for (const map of all) {
    try { if (await repositoryIdentity(map.repo) === current) selected.push(map); }
    catch { /* Missing repositories remain in the registry, but do not match this cwd. */ }
  }
  return selected;
}
