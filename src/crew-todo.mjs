import path from 'node:path';
import {atomic,readJson,stateRoot,id,loadMap,locked} from './store.mjs';
const transitions={pending:['in_progress','completed','deleted'],in_progress:['pending','completed','deleted'],completed:['deleted'],deleted:[]};
export async function crewTodo(mapId,issueId,args){
  id(mapId);id(issueId);
  return locked(`todo-${mapId}-${issueId}`.slice(0,64),async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issue)throw new Error('Unknown crew assignment');
    const file=path.join(stateRoot(),'todos',mapId,`${issueId}.json`),items=await readJson(file,[]);
    if(args.action==='list')return items;
    if(!['working','changes-requested'].includes(issue.status))throw new Error('Only active crews may change todo');
    if(args.action==='create'){
      if(!args.subject?.trim())throw new Error('Task subject required');
      items.push({id:Math.max(0,...items.map(i=>i.id))+1,subject:args.subject,status:'pending'});
    }else if(args.action==='update'){
      const item=items.find(i=>i.id===args.id);if(!item)throw new Error('Unknown task');
      if(args.status&&args.status!==item.status&&!transitions[item.status].includes(args.status))throw new Error('Invalid task transition');
      if(args.status)item.status=args.status;if(args.subject)item.subject=args.subject;
    }else throw new Error('Unknown todo action');
    await atomic(file,items);return items;
  });
}
