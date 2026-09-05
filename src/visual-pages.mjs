import fs from 'node:fs/promises';
import path from 'node:path';
import {stateRoot,readJson,atomic} from './store.mjs';
export function visualPath(id){if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid page ID');return path.join(stateRoot(),'visual-pages',`${id}.json`);}
export async function visualPages(){const dir=path.join(stateRoot(),'visual-pages');await fs.mkdir(dir,{recursive:true});return Promise.all((await fs.readdir(dir)).filter(f=>f.endsWith('.json')).map(f=>readJson(path.join(dir,f))));}
export async function publishVisualResponse(row){
  // Use the page ID as the event ID: a restart can safely replay an interrupted publish.
  if(row.status==='waiting'||row.notified)return;
  const detail={pageId:row.id,file:row.file,title:row.title,status:row.status,feedback:row.feedback,error:row.error};
  await atomic(path.join(stateRoot(),'events',`${row.id}.json`),{id:row.id,mapId:row.mapId,workerId:null,kind:row.status==='error'?'failed':'visual-response',detail,at:row.respondedAt||new Date().toISOString()});
  await atomic(visualPath(row.id),{...row,notified:true});
}
