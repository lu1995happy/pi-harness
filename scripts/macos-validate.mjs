#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {run} from '../src/process.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
if(process.platform!=='darwin'){console.error('Run macos-validate on your Mac.');process.exitCode=1;}
else {
  const output=path.join(root,'.runtime','macos-validation');await fs.mkdir(output,{recursive:true});
  const results=[];
  async function check(name,file,args,timeout=120000){
    let result;try{result=await run(file,args,{cwd:root,timeout,allowFailure:true});}catch(error){result={code:1,stdout:'',stderr:error.message};}
    await fs.writeFile(path.join(output,`${name}.log`),`${result.stdout}\n${result.stderr}`);
    results.push({name,passed:result.code===0});console.log(`${result.code===0?'PASS':'FAIL'} ${name}`);
  }
  await check('environment','node',['scripts/doctor-macos.mjs']);
  const tests=(await fs.readdir(path.join(root,'tests'))).filter(file=>file.endsWith('.test.mjs')).map(file=>path.join(root,'tests',file));
  await check('behavior','node',['--test',...tests]);
  await check('herdr-config','herdr',['config','check']);
  const sessionIndex=process.argv.indexOf('--session');
  if(sessionIndex>=0){
    const session=process.argv[sessionIndex+1];if(!session||session.startsWith('-'))throw new Error('--session requires the dedicated test session name');
    await check('herdr-contract','node',['scripts/herdr-contract-check.mjs',session]);
  }
  const report={platform:process.platform,arch:process.arch,at:new Date().toISOString(),results,interactiveChecks:'Pending: complete docs/macos-checklist.md; automated checks do not verify model behavior or mouse/clipboard interactions.'};
  await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(`Evidence saved to ${output}. Complete docs/macos-checklist.md next.`);
  if(results.some(result=>!result.passed))process.exitCode=1;
}
