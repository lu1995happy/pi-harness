import fs from 'node:fs/promises';
import path from 'node:path';
import { Herdr } from '../src/herdr.mjs';
import { crewEnvironment,sourceRoot } from '../src/crew.mjs';
import { atomic,readJson } from '../src/store.mjs';
import { run } from '../src/process.mjs';

const record=path.join(sourceRoot,'.runtime','review-session.json');
const herdr=new Herdr('pi-harness-review');
const [action,...args]=process.argv.slice(2);
process.env.PI_HARNESS_HOME=path.join(sourceRoot,'.runtime','review-home');
let session=await readJson(record,null);
if(action==='create'){
  if(session?.sessionName==='pi-harness-review')throw new Error('Review session already recorded; inspect it before creating another');
  if(session)await atomic(record+'.previous',session);
  session=await herdr.workspace(sourceRoot,'Pi harness · local review',{...crewEnvironment(),PI_HARNESS_ROLE:'reviewer'});
  session.sessionName='pi-harness-review';
  await atomic(record,session);console.log(JSON.stringify(session));
}else if(!session)throw new Error('Create the isolated review workspace first');
else if(action==='start')console.log(JSON.stringify(await herdr.start('harness-review','pi',session.pane,['--tui-mode','fullscreen','-e',path.join(sourceRoot,'extensions/index.ts')])));
else if(action==='prompt')console.log(JSON.stringify(await herdr.prompt(session.pane,args.join(' '))));
else if(action==='read')console.log(await herdr.read(session.pane));
else if(action==='keys')console.log(JSON.stringify(await herdr.call('agent','send-keys',session.pane,...args)));
else if(action==='pane-keys')console.log(JSON.stringify(await herdr.call('pane','send-keys',session.pane,...args)));
else if(action==='focus')console.log(JSON.stringify(await herdr.call('pane','focus',session.pane)));
else if(action==='snapshot')console.log(JSON.stringify(await herdr.call('api','snapshot')));
else if(action==='run')console.log(JSON.stringify(await herdr.call('pane','run',session.pane,args.join(' '))));
else throw new Error('Unknown local review action');
