#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {Herdr} from '../src/herdr.mjs';
import {sourceRoot} from '../src/crew.mjs';
const herdr=new Herdr(process.argv[2]||'pi-harness-review');
const cwd=path.join(sourceRoot,'.runtime',"shell path's");await fs.mkdir(cwd,{recursive:true});
const workspace=await herdr.workspace(sourceRoot,'Harness contract check');
const evidence={workspace,platform:process.platform};
try {
  await herdr.changeDirectory(workspace.pane,cwd);evidence.directoryAcknowledged=true;
  await herdr.close(workspace.tab);evidence.lastTabClosed=true;
  try {evidence.workspaceAfterLastTab=await herdr.call('workspace','get',workspace.workspace);}catch(error){evidence.workspaceAfterLastTab={error:error.message};}
}finally{
  try{await herdr.call('workspace','close',workspace.workspace);}catch(error){evidence.cleanup=error.message;}
  await fs.writeFile(path.join(sourceRoot,'.runtime','herdr-contract-check.json'),JSON.stringify(evidence,null,2));
  console.log(JSON.stringify(evidence,null,2));
}
