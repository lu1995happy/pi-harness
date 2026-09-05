#!/usr/bin/env node
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run } from '../src/process.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.platform!=='darwin') {
  console.error('macOS runtime checks must run on a Mac. This host is '+process.platform+'.');
  process.exitCode=1;
} else {
  const checks=await Promise.all(['node','npm','git','pi','herdr','wezterm','bun','gh','claude','codex','no-mistakes'].map(async name=>{
    try { const result=await run(name,['--version'],{timeout:10000});return {name,ok:true,version:result.stdout.split('\n')[0]}; }
    catch(error) { return {name,ok:false,error:error.message}; }
  }));
  const chrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  checks.push({name:'Chrome',ok:await fs.access(chrome).then(()=>true,()=>false),path:chrome});
  const manifest=JSON.parse(await fs.readFile(path.join(root,'package.json'),'utf8'));
  for(const name of Object.keys(manifest.dependencies)) {
    try {
      const pkg=JSON.parse(await fs.readFile(path.join(root,'node_modules',name,'package.json'),'utf8'));
      const supports=(list,value)=>!list||(!list.includes('!'+value)&&(!list.some(item=>!item.startsWith('!'))||list.includes(value)));
      checks.push({name,ok:supports(pkg.os,'darwin')&&supports(pkg.cpu,process.arch),version:pkg.version,note:'Metadata check only; native module loading and UI behavior still need application verification.'});
    }catch(error){checks.push({name,ok:false,error:error.message});}
  }
  console.log(JSON.stringify({platform:process.platform,arch:process.arch,release:os.release(),checks},null,2));
  if(checks.some(check=>!check.ok))process.exitCode=1;
}
