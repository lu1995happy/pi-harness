import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const repos = {
  herdr: 'herdrdev/herdr',
  annotate: 'plannotator/herdr-annotate',
  simplify: 'MattDevy/pi-extensions',
  firstmate: 'kunchenguid/firstmate',
  questions: 'juicesharp/rpiv-mono',
  interactive: 'amosblomqvist/pi-interactive-subagents',
  tools: 'minuque/pi-cc-extensions',
  footer: 'nicobailon/pi-powerline-footer',
  webui: 'Firstp1ck/pi-coding-agent-forge',
  lavish: 'kunchenguid/lavish-axi',
  showme: 'humanlayer/skills',
  planning: 'mattpocock/skills',
  review: 'kunchenguid/no-mistakes',
  ponytail: 'DietrichGebert/ponytail',
};
const [key, ...files] = process.argv.slice(2);
if (!repos[key]) throw new Error('Specify known source: ' + Object.keys(repos).join(', '));
const root = path.resolve('.reference', key);
await mkdir(root, { recursive: true });
async function get(url, json = true) {
  const response = await fetch(url, { headers: { 'User-Agent': 'pi-harness-source-inspection', Accept: 'application/vnd.github+json' } });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return json ? response.json() : response.text();
}
const info = await get(`https://api.github.com/repos/${repos[key]}`);
const commit = await get(`https://api.github.com/repos/${repos[key]}/commits/${info.default_branch}`);
if(files[0]==='--release'){
  const release=await get(`https://api.github.com/repos/${repos[key]}/releases/latest`);
  const record={repo:repos[key],tag:release.tag_name,assets:release.assets.map(asset=>({name:asset.name,url:asset.browser_download_url,digest:asset.digest}))};
  await writeFile(path.join(root,'release.json'),JSON.stringify(record,null,2));console.log(JSON.stringify(record));
}else if (!files.length) {
  const tree = await get(`https://api.github.com/repos/${repos[key]}/git/trees/${commit.sha}?recursive=1`);
  await writeFile(path.join(root, 'tree.json'), JSON.stringify({ repo: repos[key], sha: commit.sha, ...tree }, null, 2));
  console.log(JSON.stringify({ repo: repos[key], sha: commit.sha, files: tree.tree.filter(e => e.type === 'blob').length, index:path.join(root,'tree.json') }));
} else {
  for (const file of files) {
    const target = path.resolve(root, file);
    if (!target.startsWith(root + path.sep)) throw new Error('Path outside reference directory');
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, await get(`https://raw.githubusercontent.com/${repos[key]}/${commit.sha}/${file}`, false));
    console.log(`${file} @ ${commit.sha}`);
  }
  await writeFile(path.join(root, 'source.json'), JSON.stringify({ repo: repos[key], sha: commit.sha, files }, null, 2));
}
