import fs from 'node:fs/promises';
import path from 'node:path';
import { atomic, readJson, stateRoot } from './store.mjs';

function eventId(value) {
  if(typeof value!=='string'||!/^[a-f0-9-]{36}$/.test(value))throw new Error('Invalid event ID');
  return value;
}
export const acknowledgementPath=value=>path.join(stateRoot(),'acknowledgements',`${eventId(value)}.json`);
export const isAcknowledged=async value=>Boolean(await readJson(acknowledgementPath(value),null));
export async function acknowledge(ids,mapIds) {
  for(const value of ids){
    eventId(value);
    const outcome=await readJson(path.join(stateRoot(),'outcomes',`${value}.json`));
    if(!mapIds.includes(outcome.mapId))throw new Error('Cannot acknowledge another repository’s event');
  }
  for(const value of ids)await atomic(acknowledgementPath(value),{id:value,at:new Date().toISOString()});
}
export function shouldDeliver(row,{acknowledged=false,delivered=false,lastAttempt=0,now=Date.now()}={}) {
  if(acknowledged)return false;
  if(row.verdict==='routine')return !delivered&&!lastAttempt;
  return !lastAttempt||now-lastAttempt>=60000;
}

export async function acquireSupervisor(key,owner) {
  const file=path.join(stateRoot(),'supervisors',`${key}.json`);
  if(!/^[a-f0-9]{64}$/.test(key))throw new Error('Invalid supervisor key');
  await fs.mkdir(path.dirname(file),{recursive:true});
  try { await fs.writeFile(file,JSON.stringify({owner,pid:process.pid}),{flag:'wx'});return true; }
  catch(error){if(error.code!=='EEXIST')throw error;}
  const existing=await readJson(file);
  if(existing.owner===owner&&existing.pid===process.pid)return true;
  try { process.kill(existing.pid,0);return false; }
  catch(error){if(error.code!=='ESRCH')return false;}
  // Serialize stale-owner recovery separately; contenders never remove a newly acquired lease.
  const recovery=file+'.recover';
  try { await fs.mkdir(recovery); } catch(error){if(error.code==='EEXIST')return false;throw error;}
  try {
    const check=await readJson(file,null);
    if(check?.owner!==existing.owner||check?.pid!==existing.pid)return false;
    await fs.unlink(file);
  }finally{await fs.rmdir(recovery);}
  return acquireSupervisor(key,owner);
}
export async function releaseSupervisor(key,owner) {
  if(!key)return;
  const file=path.join(stateRoot(),'supervisors',`${key}.json`);
  const record=await readJson(file,null);
  if(record?.owner===owner&&record.pid===process.pid)await fs.unlink(file);
}
