// State transition rules extracted from rpiv-todo/state/invariants.ts, MIT,
// juicesharp/rpiv-mono at 338b264c1ca4fd8828cc849b632f4f7ad88d2e78.
// Own smaller UI/storage integration; no upstream overlay/i18n package loaded.
import path from 'node:path';
import { Type } from 'typebox';
import { atomic, readJson, stateRoot } from '../src/store.mjs';
import {crewTodo} from '../src/crew-todo.mjs';
const transitions:any={pending:['in_progress','completed','deleted'],in_progress:['pending','completed','deleted'],completed:['deleted'],deleted:[]};
export function installTodo(pi:any,assignment:any){
  const isCrew=assignment?.role==='crew';
  const identity=isCrew?(assignment?.issueId||process.pid):`${assignment?.role||'background'}-${assignment?.reviewer||process.pid}`;
  let ctx:any,items:any[]=[];const file=path.join(stateRoot(),'todos',assignment?.mapId||'session',`${String(identity).replace(/[^a-zA-Z0-9_-]/g,'_')}.json`);
  const show=()=>ctx?.hasUI&&ctx.ui.setWidget('harness-todo',items.filter(i=>i.status!=='deleted').map(i=>`${i.status==='completed'?'✓':i.status==='in_progress'?'▸':'○'} ${i.id}. ${i.subject}`));
  pi.on('session_start',async(_e:any,c:any)=>{ctx=c;items=await readJson(file,[]);show();});
  pi.registerTool({name:'todo',label:'Crew todo',description:'Track your assigned work. Completed tasks cannot be reopened; add a new task for follow-up work.',parameters:Type.Object({action:Type.Union([Type.Literal('create'),Type.Literal('update'),Type.Literal('list')]),id:Type.Optional(Type.Number()),subject:Type.Optional(Type.String()),status:Type.Optional(Type.Union(['pending','in_progress','completed','deleted'].map(v=>Type.Literal(v))))}),execute:async(_id:any,args:any)=>{
    if(isCrew&&assignment?.mapId&&assignment?.issueId){items=await crewTodo(assignment.mapId,assignment.issueId,args);show();return {content:[{type:'text',text:JSON.stringify(items)}],details:{tasks:items}};}
    if(args.action==='create'){if(!args.subject?.trim())throw new Error('Task subject required');items.push({id:Math.max(0,...items.map(i=>i.id))+1,subject:args.subject,status:'pending'});}
    if(args.action==='update'){const item=items.find(i=>i.id===args.id);if(!item)throw new Error('Unknown task');if(args.status&&args.status!==item.status&&!transitions[item.status].includes(args.status))throw new Error('Invalid task transition');if(args.status)item.status=args.status;if(args.subject)item.subject=args.subject;}
    await atomic(file,items);show();return {content:[{type:'text',text:JSON.stringify(items)}],details:{tasks:items}};
  }});
}
