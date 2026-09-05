import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { Type } from 'typebox';
import { spawn } from 'node:child_process';
import { run } from '../src/process.mjs';
import { executable } from '../src/config.mjs';
import { sourceRoot } from '../src/crew.mjs';
import { atomic,stateRoot,event,loadMap,maps } from '../src/store.mjs';
import { mapsForRepository } from '../src/repository.mjs';
import { acquireSupervisor,releaseSupervisor } from '../src/supervision-state.mjs';
import { visualPages,visualPath,publishVisualResponse } from '../src/visual-pages.mjs';

export function installLavish(pi:any){
  const cli=path.join(sourceRoot,'node_modules/lavish-axi/dist/cli.mjs');
  const owner=randomUUID(),watchers=new Map<string,any>();let stopped=false;
  async function watch(row:any){
    if(stopped||watchers.has(row.id))return;
    const key=createHash('sha256').update(`lavish:${row.id}`).digest('hex');
    if(!await acquireSupervisor(key,owner))return;
    const child=spawn(executable('node'),[cli,'poll',row.file],{windowsHide:true,stdio:['ignore','pipe','pipe']});
    watchers.set(row.id,{child,key});let output='',errors='';
    child.stdout.on('data',(data:any)=>{output+=data;if(output.length+errors.length>500000)child.kill();});
    child.stderr.on('data',(data:any)=>{errors+=data;if(output.length+errors.length>500000)child.kill();});
    child.on('error',(error:any)=>{errors=error.message;});
    child.on('close',async(code:any)=>{
      try {
        if(stopped)return;
        const ended=/status:\s*ended|"status"\s*:\s*"ended"/.test(output);
        const status=ended?'ended':code===0?'responded':'error';
        const response={...row,status,feedback:output,error:errors,respondedAt:new Date().toISOString()};
        await atomic(visualPath(row.id),response);await publishVisualResponse(response);
      }catch(error:any){pi.appendEntry('fm-visual-error',{pageId:row.id,error:error.message});}
      finally{watchers.delete(row.id);await releaseSupervisor(key,owner);}
    });
  }
  pi.registerTool({name:'fm_visual',label:'Visual question',description:'Open a crew-prepared Show-me HTML question in Lavish. Responses return through supervision. Associate it with the map awaiting the decision.',parameters:Type.Object({mapId:Type.String(),file:Type.String(),title:Type.String()}),execute:async(_id:any,args:any)=>{
    const map=await loadMap(args.mapId);if(map.status!=='active')throw new Error('Visual question requires an active map');
    const file=path.resolve(args.file);const opened=await run('node',[cli,file],{timeout:45000});
    const row={id:randomUUID(),mapId:map.id,file,title:args.title,status:'waiting'};
    await atomic(visualPath(row.id),row);await watch(row);
    return {content:[{type:'text',text:opened.stdout}],details:row};
  }});
  pi.on('session_start',async(_e:any,ctx:any)=>{
    stopped=false;const ids=(await mapsForRepository(await maps(),ctx.cwd)).map(m=>m.id);
    for(const row of await visualPages())if(ids.includes(row.mapId)){if(row.status==='waiting')await watch(row);else await publishVisualResponse(row);}
  });
  pi.on('session_shutdown',()=>{stopped=true;for(const {child} of watchers.values())child.kill();});
}
