import {event,loadMap,locked,saveMap} from './store.mjs';
import {Herdr} from './herdr.mjs';

export async function observeFleet(mapId,herdr=new Herdr()) {
  const snapshot=await loadMap(mapId);
  for(const issue of snapshot.issues){
    const endpoint=issue.status==='reviewing'?issue.reviewer:issue.worker;
    if(!endpoint?.ready||!['working','reviewing','waiting'].includes(issue.status))continue;
    let status;
    try { const body=await herdr.call('agent','get',endpoint.name);status=body.agent?.agent_status||'unknown'; }
    catch(error){status='unreachable';}
    await locked(mapId,async()=>{
      const map=await loadMap(mapId),current=map.issues.find(i=>i.id===issue.id);
      const active=current.status==='reviewing'?current.reviewer:current.worker;
      if(active?.name!==endpoint.name||!['working','reviewing','waiting'].includes(current.status))return;
      const previous=active.health;
      if(previous===status)return;
      active.health=status;
      // Normal readiness is not completion. Wake only for a block/loss, or a worker that
      // actually ran and then went idle without sending the expected lifecycle report.
      if(['blocked','unreachable','unknown'].includes(status)||(previous==='working'&&['idle','done'].includes(status)&&current.status!=='waiting')){
        await event(mapId,issue.id,'failed',{message:`${active.name} is ${status} while issue is ${current.status}. Inspect the recorded worker; do not assume completion.`,pane:active.pane});
      }
      await saveMap(map);
    });
  }
}
