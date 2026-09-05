import fs from 'node:fs';
import path from 'node:path';
import { Type } from 'typebox';
import questions from '../node_modules/@juicesharp/rpiv-ask-user-question/index.ts';
import fff from '../node_modules/@ff-labs/pi-fff/src/index.ts';
import chrome from '../node_modules/@narumitw/pi-chrome-devtools/dist/index.ts';
import { installUI } from './ui.ts';
import { installSupervision } from '../components/firstmate/supervision.ts';
import { config, harnessHome } from '../src/config.mjs';
import { createMap, addIssues, completeIssue, reviewIssue, mergeIssue, cleanupIssue, finalReview, shipMap } from '../src/maps.mjs';
import { dispatch, dispatchReview, askCrew, askGate, answerCrew, sourceRoot } from '../src/crew.mjs';
import { maps, loadMap, readJson, atomic, stateRoot } from '../src/store.mjs';
import { Herdr } from '../src/herdr.mjs';
import { installTodo } from './todo.ts';
import { installLavish } from './lavish.ts';
import herdrState from '../components/herdr/agent-state.ts';
import simplify from '../components/simplify/index.ts';

const result=(value:any)=>({content:[{type:'text',text:JSON.stringify(value,null,2)}],details:value});
export default function(pi:any){
  herdrState(pi);
  pi.registerFlag('harness-assignment',{description:'Owned crew assignment file',type:'string'});
  const flag=pi.getFlag('harness-assignment') as string|undefined;
  const argvIndex=process.argv.indexOf('--harness-assignment');
  const assignmentFile=flag||(argvIndex>=0?process.argv[argvIndex+1]:undefined);
  const assignment=assignmentFile?JSON.parse(fs.readFileSync(assignmentFile,'utf8')):null;
  const role=process.env.NO_MISTAKES_GATE?'pipeline':assignment?.role||process.env.PI_HARNESS_ROLE||'main';
  const status=installUI(pi,role);
  if(role==='main'){
    for(const name of ['grill-with-docs','wayfinder','to-spec','to-tickets','show-me'])pi.registerCommand(name,{description:`Run the ${name} workflow`,handler:async(args:string)=>{pi.sendUserMessage(`Read and apply ${path.join(sourceRoot,'skills',name,'SKILL.md')}. ${args||''}`,{deliverAs:'followUp'});}});
    questions(pi);installSupervision(pi,status);installLavish(pi);
    pi.registerTool({name:'fm_map',label:'Map orchestration',description:'Create and manage delivery maps. Delegate implementation and independent reviews; merge only reviewed work; clean only merged issues; ship only the reviewed map head.',
      parameters:Type.Object({action:Type.Union(['create','add-issues','list','status','dispatch','review','merge','cleanup','final-review','ship','answer'].map(v=>Type.Literal(v))),mapId:Type.Optional(Type.String()),issueId:Type.Optional(Type.String()),kind:Type.Optional(Type.String()),answer:Type.Optional(Type.String()),spec:Type.Optional(Type.Any())}),
      execute:async(_id:any,args:any)=>{
        switch(args.action){
          case 'create':return result(await createMap(args.spec));
          case 'add-issues':return result(await addIssues(args.mapId,args.spec.issues));
          case 'list':return result(await maps());
          case 'status':return result(await loadMap(args.mapId));
          case 'dispatch':return result(await dispatch(args.mapId,args.issueId,args.kind));
          case 'review':return result(await dispatchReview(args.mapId,args.issueId));
          case 'merge':return result(await mergeIssue(args.mapId,args.issueId));
          case 'cleanup':return result(await cleanupIssue(args.mapId,args.issueId,new Herdr()));
          case 'final-review':return result(await dispatchReview(args.mapId,null));
          case 'ship':return result(await shipMap(args.mapId));
          case 'answer':return result(await answerCrew(args.mapId,args.issueId,args.answer));
        }
      }});
    pi.on('session_start',()=>{pi.setActiveTools(['read','grep','find','ls','fm_map','fm_ack','ask_user_question','fm_visual']);});
    pi.on('before_agent_start',(event:any)=>({systemPrompt:event.systemPrompt+`\nYou are Firstmate, the coordinator of this user's global Pi + Herdr harness. Never implement, debug, or perform substantive reviews yourself: dispatch crews. Use fm_map to create/execute maps and advance independent review, merge and cleanup steps. Worker questions are yours to answer using existing decisions; only escalate genuine missing user decisions. Simple non-UI questions use ask_user_question. Complex or UI questions use Show-me + fm_visual (Lavish). Calm preserves user prompt and final reply. Never use todo. After all issues merge, dispatch final no-mistakes review; only green reviewed code may ship. Map spec is {mapId,repo,title,issues:[{id,title,body,acceptance,dependsOn}],base?}; map membership uses this explicit issue list, not GitHub sub-issues. Source root: ${sourceRoot}.` }));
  }else{
    fff(pi);chrome(pi);
    if(role==='crew'){
      simplify(pi);
      installTodo(pi,assignment);
      pi.registerTool({name:'ask_question',label:'Ask Firstmate',description:'Ask your coordinator a question and wait for its answer. It answers or escalates to the user.',parameters:Type.Object({question:Type.String()}),execute:async(_id:any,args:any)=>{
        if(!assignment)throw new Error('This session has no crew assignment');
        return result(await askCrew(assignment.mapId,assignment.issueId,args.question));
      }});
      pi.registerTool({name:'fm_complete',label:'Report completion',description:'Report committed, tested implementation to Firstmate for separate review.',parameters:Type.Object({summary:Type.String()}),execute:async(_id:any,args:any)=>{
        if(!assignment)throw new Error('This session has no crew assignment');
        return result(await completeIssue(assignment.mapId,assignment.issueId,args.summary));
      }});
    }else if(role==='reviewer'){
      pi.registerTool({name:'fm_gate_question',label:'Ask Firstmate about gate',description:'Escalate a final no-mistakes finding to Firstmate, retaining the finding ID and full description.',parameters:Type.Object({question:Type.String()}),execute:async(_id:any,args:any)=>{if(!assignment||assignment.issueId)throw new Error('Final reviewer only');return result(await askGate(assignment.mapId,args.question));}});
      pi.registerTool({name:'fm_review',label:'Report independent review',description:'Record findings against the exact reviewed commit. Pass only after verifying the assigned work.',parameters:Type.Object({head:Type.String(),verdict:Type.Union([Type.Literal('pass'),Type.Literal('changes')]),summary:Type.String()}),execute:async(_id:any,args:any)=>{
        if(!assignment)throw new Error('This session has no review assignment');
        return result(await (assignment.issueId?reviewIssue(assignment.mapId,assignment.issueId,{...args,reviewer:assignment.reviewer}):finalReview(assignment.mapId,{...args,reviewer:assignment.reviewer})));
      }});
    }
    pi.on('tool_call',async(event:any)=>{
      if(!assignment)return;
      const map=await loadMap(assignment.mapId);
      if(role==='crew'){
        const issue=map.issues.find((i:any)=>i.id===assignment.issueId);
        if(!issue||!['working','changes-requested'].includes(issue.status))return {block:true,reason:`Crew is ${issue?.status||'unassigned'}. Stop tool work and wait for Firstmate.`};
      }else if(role==='reviewer'){
        const issue=assignment.issueId?map.issues.find((i:any)=>i.id===assignment.issueId):null;
        const reviewer=assignment.issueId?issue?.reviewer:map.reviewer;
        if(reviewer?.name!==assignment.reviewer)return {block:true,reason:'This review assignment was replaced; stop tool work.'};
        if(assignment.issueId&&issue?.status!=='reviewing')return {block:true,reason:'Review has ended; wait for Firstmate.'};
        if(!assignment.issueId&&map.reviewer?.completed)return {block:true,reason:'Final review has ended; Firstmate owns the next step.'};
        if(['write','edit'].includes(event.toolName))return {block:true,reason:'Independent reviewer cannot edit source directly.'};
        if(!assignment.issueId&&map.gateQuestion&&!map.gateQuestion.answer)return {block:true,reason:'Wait for Firstmate to answer the outstanding gate question.'};
      }
    });
    pi.on('before_agent_start',(event:any)=>({systemPrompt:event.systemPrompt+(role==='pipeline'?'\nYou are inside a no-mistakes validation step. Complete only the assigned phase, including phase-authorized fixes. Do not start or control another no-mistakes run, dispatch crews, or publish. Return findings to the existing pipeline.':`\nYou are a ${role} reporting to Firstmate. Stay within your assigned worktree. Do not push, open PRs or merge. ${role==='crew'?'Use todo to track implementation. Ask Firstmate through ask_question, and stop dependent work until answered. Commit and test before fm_complete. Apply the globally available ponytail skill to coding decisions.':'Review independently. Do not edit source directly; final reviewers may drive no-mistakes-owned fixes. Report findings and the current reviewed HEAD with fm_review.'}`)}));
  }
  pi.registerCommand('harness',{description:'Show harness role, configuration and maps.',handler:async(_args:any,ctx:any)=>{ctx.ui.notify(`Role: ${role}\nHome: ${harnessHome()}\nMaps: ${(await maps()).map(m=>m.id).join(', ')||'none'}`,'info');}});
}
