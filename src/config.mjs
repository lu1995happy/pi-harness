import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

export const agentDir = () => process.env.PI_CODING_AGENT_DIR || path.join(os.homedir(), '.pi', 'agent');
export const harnessHome = () => process.env.PI_HARNESS_HOME || path.join(agentDir(), 'harness');
export function config() {
  const file = path.join(harnessHome(), 'config.json');
  const overrides = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
  return { calm: true, maxWorkers: 3, pollMs: 1500, defaultWorker: 'pi', supervision: { thinking: 'low' }, ...overrides };
}
export function executable(name) {
  const override = config().executables?.[name];
  if (override) return override;
  if (process.platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const candidates = {
      pi: [path.join(local, 'pi-node', 'current', 'pi.cmd')],
      node: [path.join(local, 'pi-node', 'current', 'node.exe'), process.execPath],
      git: ['C:/Program Files/Git/cmd/git.exe'],
      gh: ['C:/Program Files/GitHub CLI/gh.exe'],
      herdr: [],
    };
    if (name === 'herdr') {
      const releases = path.join(os.homedir(), '.herdr', 'packages', 'standalone', 'releases');
      if (fs.existsSync(releases)) for (const dir of fs.readdirSync(releases).sort((a,b) => b.localeCompare(a, undefined, {numeric:true}))) candidates.herdr.push(path.join(releases, dir, 'herdr.exe'));
    }
    for (const item of candidates[name] || []) if (fs.existsSync(item)) return item;
  }
  return name;
}
