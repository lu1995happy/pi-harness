import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Herdr } from '../src/herdr.mjs';
import { crewEnvironment,sourceRoot } from '../src/crew.mjs';
import { atomic,readJson } from '../src/store.mjs';
import { run } from '../src/process.mjs';

const record=path.join(sourceRoot,'.runtime','review-session.json');
const herdr=new Herdr('pi-harness-review');
const [action,...args]=process.argv.slice(2);
process.env.PI_HARNESS_HOME=path.join(sourceRoot,'.runtime','review-home');
let session=await readJson(record,null);
if(action==='fresh-ui-review'){
  if(session)await atomic(record+'.previous',session);
  session=await herdr.workspace(sourceRoot,'UI acceptance · mouse and prompt',{});
  session.sessionName='pi-harness-review';await atomic(record,session);console.log(JSON.stringify(session));
}else if(action==='create'){
  if(session?.sessionName==='pi-harness-review')throw new Error('Review session already recorded; inspect it before creating another');
  if(session)await atomic(record+'.previous',session);
  session=await herdr.workspace(sourceRoot,'Pi harness · local review',{...crewEnvironment(),PI_HARNESS_ROLE:'reviewer'});
  session.sessionName='pi-harness-review';
  await atomic(record,session);console.log(JSON.stringify(session));
}else if(!session)throw new Error('Create the isolated review workspace first');
else if(action==='start')console.log(JSON.stringify(await herdr.start('harness-review','pi',session.pane,['--tui-mode','regular','-e',path.join(sourceRoot,'extensions/index.ts')])));
else if(action==='start-global')console.log(JSON.stringify(await herdr.start(`harness-review-${session.workspace}`,'pi',session.pane,[])));
else if(action==='global-check-cwd'){
  const cwd=await fs.mkdtemp(path.join(os.tmpdir(),'pi-harness-global-check-'));
  await herdr.changeDirectory(session.pane,cwd);console.log(cwd);
}else if(action==='restore-cwd'){await herdr.changeDirectory(session.pane,sourceRoot);console.log(sourceRoot);}
else if(action==='prompt')console.log(JSON.stringify(await herdr.prompt(session.pane,args.join(' '))));
else if(action==='read')console.log(await herdr.read(session.pane));
else if(action==='wheel'){
  await herdr.call('pane','send-text',session.pane,'\x1b[<64;8;5M');
  console.log('Sent wheel-up report to the dedicated review pane.');
}
else if(action==='mouse'){
  const [column,row]=args.map(Number);
  if(!Number.isInteger(column)||!Number.isInteger(row)||column<1||row<1)throw new Error('Expected positive column and row');
  await herdr.call('pane','send-text',session.pane,`\x1b[<0;${column};${row}M`);
  await herdr.call('pane','send-text',session.pane,`\x1b[<0;${column};${row}m`);
  console.log('Sent mouse press and release to dedicated review pane.');
}
else if(action==='read-ansi'){
  const output=await run('herdr',['--session','pi-harness-review','pane','read',session.pane,'--source','visible','--format','ansi','--raw']);
  await fs.writeFile(path.join(sourceRoot,'.runtime','style-preview.ansi'),output.stdout);console.log('Saved dedicated review pane ANSI snapshot.');
}
else if(action==='keys')console.log(JSON.stringify(await herdr.call('agent','send-keys',session.pane,...args)));
else if(action==='pane-keys')console.log(JSON.stringify(await herdr.call('pane','send-keys',session.pane,...args)));
else if(action==='focus')console.log(JSON.stringify(await herdr.call('pane','focus',session.pane)));
else if(action==='snapshot')console.log(JSON.stringify(await herdr.call('api','snapshot')));
else if(action==='run')console.log(JSON.stringify(await herdr.call('pane','run',session.pane,args.join(' '))));
else throw new Error('Unknown local review action');
