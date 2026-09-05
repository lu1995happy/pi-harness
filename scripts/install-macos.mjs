#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {run} from '../src/process.mjs';
import {atomic,readJson} from '../src/store.mjs';

const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['components','extensions','src','skills','scripts','docs','tests','package.json','package-lock.json','PROGRESS.md','README.md','upstream.json'];
const digests={arm64:'8c0717e6c61b29c48d72aa4e6965ea305b2bd53a9a22bd0082ae2f1dad94e139',x64:'1315c7955962a7fa8b51e22b2592e99f89fa85816433a1162dc68839d195ce52'};

export function activationSettings(settings,release,previous){
  const packages=(settings.packages||[]).filter(item=>(typeof item==='string'?item:item.source)!==previous);
  if(!packages.some(item=>(typeof item==='string'?item:item.source)===release))packages.push(release);
  return {...settings,packages,tuiMode:'fullscreen'};
}
async function installGate(home){
  const digest=digests[process.arch];if(!digest)throw new Error('Unsupported macOS architecture');
  const destination=path.join(home,'bin','no-mistakes');
  const existing=await run(destination,['--version'],{allowFailure:true}).catch(()=>null);
  if(existing?.code===0&&existing.stdout.includes('1.64.0'))return destination;
  const arch=process.arch==='x64'?'amd64':'arm64';
  const url=`https://github.com/kunchenguid/no-mistakes/releases/download/v1.64.0/no-mistakes-v1.64.0-darwin-${arch}.tar.gz`;
  const response=await fetch(url);if(!response.ok)throw new Error(`No-mistakes download failed: ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(createHash('sha256').update(bytes).digest('hex')!==digest)throw new Error('No-mistakes archive digest mismatch');
  const temp=await fs.mkdtemp(path.join(os.tmpdir(),'pi-harness-gate-'));const archive=path.join(temp,'gate.tar.gz');await fs.writeFile(archive,bytes);
  const listing=(await run('tar',['-tzf',archive])).stdout.split('\n');
  if(!listing.includes('no-mistakes'))throw new Error('Expected no-mistakes executable missing from archive');
  await run('tar',['-xzf',archive,'-C',temp,'no-mistakes']);
  await fs.mkdir(path.dirname(destination),{recursive:true});
  if(existing?.code===0)await fs.copyFile(destination,`${destination}.previous-${Date.now()}`);
  await fs.copyFile(path.join(temp,'no-mistakes'),destination);await fs.chmod(destination,0o755);
  await run(destination,['--version']);return destination;
}
async function main(){
  if(process.platform!=='darwin')throw new Error('Run the global installer on macOS; this host is '+process.platform);
  const agent=path.resolve(process.env.PI_CODING_AGENT_DIR||path.join(os.homedir(),'.pi','agent'));
  const home=path.resolve(process.env.PI_HARNESS_HOME||path.join(agent,'harness'));
  const settingsFile=path.join(agent,'settings.json'),installationFile=path.join(home,'installation.json');
  const settings=await readJson(settingsFile,{}),installation=await readJson(installationFile,{});
  if(process.argv.includes('--rollback')){
    if(!installation.previous)throw new Error('No previous release recorded');
    await fs.access(path.join(installation.previous,'extensions','index.ts'));
    await atomic(`${settingsFile}.backup-${Date.now()}`,settings);
    await atomic(settingsFile,activationSettings(settings,installation.previous,installation.current));
    await atomic(installationFile,{...installation,current:installation.previous,previous:installation.current});
    console.log('Restored '+installation.previous+'. Restart Pi sessions; runtime state is preserved.');return;
  }
  for(const executable of ['node','npm','git','pi','herdr'])await run(executable,['--version']);
  const bun=await run('bun',['--version'],{allowFailure:true}).catch(()=>null);
  if(bun?.code!==0)await run('brew',['install','oven-sh/bun/bun'],{timeout:300000});
  const release=path.join(home,'releases',`${new Date().toISOString().replaceAll(':','-')}-${randomUUID().slice(0,8)}`);
  await fs.mkdir(release,{recursive:true});
  for(const file of files)await fs.cp(path.join(source,file),path.join(release,file),{recursive:true,errorOnExist:true,force:false});
  await run('npm',['ci','--ignore-scripts','--legacy-peer-deps'],{cwd:release,timeout:300000});
  const testFiles=(await fs.readdir(path.join(release,'tests'))).filter(file=>file.endsWith('.test.mjs')).map(file=>path.join(release,'tests',file));
  await run('node',['--test',...testFiles],{cwd:release,timeout:120000});
  const gate=await installGate(home);
  const gateConfig=path.join(process.env.NM_HOME||path.join(os.homedir(),'.no-mistakes'),'config.yaml');
  await fs.mkdir(path.dirname(gateConfig),{recursive:true});
  try{await fs.writeFile(gateConfig,'agent: pi\n',{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
  const configuration=await readJson(path.join(home,'config.json'),{});
  await atomic(path.join(home,'config.json'),{...configuration,calm:configuration.calm??true,executables:{...configuration.executables,'no-mistakes':gate}});
  await run('node',[path.join(release,'scripts','install-annotate-macos.mjs')],{timeout:300000});
  for(const kind of ['claude','codex']){
    const available=await run(kind,['--version'],{allowFailure:true}).catch(()=>null);
    if(available?.code===0)await run('herdr',['integration','install',kind]);
  }
  const latestSettings=await readJson(settingsFile,{});
  await atomic(`${settingsFile}.backup-${Date.now()}`,latestSettings);
  await atomic(settingsFile,activationSettings(latestSettings,release,installation.current));
  await atomic(installationFile,{current:release,previous:installation.current||null,installedAt:new Date().toISOString()});
  console.log(`Installed ${release}\nRestart Pi in an existing project. Run herdr server reload-config in its session.\nApplication verification: node ${path.join(release,'scripts','doctor-macos.mjs')}`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
