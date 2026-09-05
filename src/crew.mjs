import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { config, executable, harnessHome } from './config.mjs';
import { git, shellCommand } from './process.mjs';
import { atomic, event, loadMap, locked, maps, saveMap, stateRoot, readJson } from './store.mjs';
import { prepareIssue, shortName, cleanupDeferred } from './maps.mjs';
import { Herdr } from './herdr.mjs';

export const sourceRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function crewEnvironment() {
  const bins=[path.join(harnessHome(),'bin'),...new Set(['pi','herdr','git'].map(executable).filter(file=>path.isAbsolute(file)).map(file=>path.dirname(file)))];
  return { PATH:[...bins,process.env.PATH||''].join(path.delimiter),PI_HARNESS_HOME:harnessHome(),PI_HARNESS_ROLE:'crew' };
}
function reportCommand(mapId,issueId,action,details) {
  // A literal command example, never executed through a shell by the coordinator.
  return shellCommand(executable('node'),[path.join(sourceRoot,'scripts/harness.mjs'),action,mapId,issueId,JSON.stringify(details)]);
}
export async function dispatch(mapId,issueId,kind=config().defaultWorker,herdr=new Herdr()) {
  let map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
  if(!issue)throw new Error('Unknown issue');
  if(map.issues.filter(i=>['working','reviewing'].includes(i.status)).length>=config().maxWorkers)throw new Error('Map worker concurrency limit reached');
  if(issue.status==='pending')issue=await prepareIssue(mapId,issueId,kind);
  const dispatched=await locked(mapId,async()=>{
    map=await loadMap(mapId);issue=map.issues.find(i=>i.id===issueId);
    if(!['prepared','changes-requested'].includes(issue.status))throw new Error('Issue not dispatchable');
    if(map.issues.filter(i=>i.id!==issueId&&['working','reviewing','waiting'].includes(i.status)).length>=config().maxWorkers)throw new Error('Map worker concurrency limit reached');
    kind=issue.kind||kind;
    if(issue.status==='changes-requested'&&issue.reviewer&&!issue.reviewer.closed){await herdr.close(issue.reviewer.tab);issue.reviewer.closed=true;await saveMap(map);}
    if(!map.herdr){map.herdr=await herdr.workspace(map.worktree,`Map: ${map.title}`,crewEnvironment());await saveMap(map);}
    if(issue.worker?.ready===false){
      // No assignment prompt was sent before readiness. Retire only this recorded failed launch.
      if(!issue.replacementEndpoint){issue.replacementEndpoint=await herdr.tab(map.herdr.workspace,issue.worktree,issueId,crewEnvironment());await saveMap(map);}
      await herdr.close(issue.worker.tab);
      issue.launchHistory=[...(issue.launchHistory||[]),{...issue.worker,closed:true}];
      issue.worker=null;await saveMap(map);
    }
    if(!issue.worker){
      const endpoint=issue.replacementEndpoint||(!map.herdr.initialUsed?{tab:map.herdr.tab,pane:map.herdr.pane}:await herdr.tab(map.herdr.workspace,issue.worktree,issueId,crewEnvironment()));
      delete issue.replacementEndpoint;
      // Keep the workspace rooted in the stable map worktree, then move its default shell.
      const descriptor={mapId,issueId,role:'crew',worktree:issue.worktree};
      const taskFile=path.join(stateRoot(),'assignments',mapId,`${issueId}.json`);await atomic(taskFile,descriptor);
      issue.worker={...endpoint,name:shortName(mapId,issueId,'crew'),assignment:taskFile,ready:false};map.herdr.initialUsed=true;await saveMap(map);
      try {
        await herdr.changeDirectory(endpoint.pane,issue.worktree);
        const args=kind==='pi'?['-e',path.join(sourceRoot,'extensions/index.ts'),'--harness-assignment',taskFile]:[];
        await herdr.start(issue.worker.name,kind,endpoint.pane,args);
        issue.worker.ready=true;await saveMap(map);
      } catch(error) {
        issue.worker.startError=error.message;await saveMap(map);
        throw new Error(`Worker startup needs recovery in ${endpoint.pane}: ${error.message}`);
      }
    }
    if(issue.worker.ready===false)throw new Error(`Worker startup is unconfirmed in ${issue.worker.pane}; inspect the recorded pane before recovery. ${issue.worker.startError||''}`);
    const brief=[`You are a ${kind} crew worker on map ${mapId}, issue ${issueId}: ${issue.title}.`,
      `Work ONLY in ${issue.worktree}. Firstmate coordinates; you implement. Do not create PRs or push.`,
      `You may incorporate the map branch ${map.branch} into your own issue branch to resolve integration conflicts. Never merge into the map branch or main/master yourself.`,
      issue.body||'',`Acceptance criteria: ${JSON.stringify(issue.acceptance||[])}`,`Dependencies merged: ${issue.dependsOn.join(', ')||'none'}`,
      'Track work with crew todo. Ask Firstmate with ask_question if needed. For non-Pi agents use the CLI question command below.',
      `Non-Pi todo example: ${reportCommand(mapId,issueId,'todo',{action:'create',subject:'YOUR TASK'})}. The same command supports action list and update (id, status). Read ${path.join(sourceRoot,'skills/ponytail/SKILL.md')} for coding guidance.`,
      `Question: ${reportCommand(mapId,issueId,'question',{question:'YOUR QUESTION'})}`,
      'Commit your changes, run relevant tests, then report completion with fm_complete (Pi) or this CLI command:',
      reportCommand(mapId,issueId,'complete',{summary:'YOUR SUMMARY AND TEST RESULTS'}),
      issue.status==='changes-requested'?`Address review findings: ${JSON.stringify(issue.reviews.at(-1))}`:''].join('\n\n');
    issue.status='working';issue.promptDelivery='sending';await saveMap(map);
    try{await herdr.prompt(issue.worker.name,brief);issue.promptDelivery='sent';await saveMap(map);}
    catch(error){issue.promptDelivery='uncertain';await saveMap(map);await event(mapId,issueId,'failed',{message:'Assignment prompt delivery uncertain; inspect the worker before sending it again.',error:error.message});throw error;}
    return issue;
  });
  await cleanupDeferred(mapId,herdr);return dispatched;
}
export async function dispatchReview(mapId,issueId,herdr=new Herdr()) {
  const dispatched=await locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=issueId?map.issues.find(i=>i.id===issueId):null;
    const previous=issue?issue.reviewer:map.reviewer;
    if(issueId&&(!issue||!(issue.status==='awaiting-review'||(issue.status==='reviewing'&&previous?.ready===false))))throw new Error('Issue not ready for review');
    if(!issueId&&map.issues.some(i=>i.status!=='merged'))throw new Error('Map has incomplete issues');
    if(!issueId&&previous&&!previous.completed&&previous.ready!==false)throw new Error('Final review already running');
    if(!map.herdr)throw new Error('Map workspace missing');
    const cwd=issue?.worktree||map.worktree,head=await git(cwd,'rev-parse','HEAD');
    const reviewState=issue||map;
    const endpoint=reviewState.nextReviewEndpoint||await herdr.tab(map.herdr.workspace,cwd,issueId?`Review: ${issueId}`:'Final review',crewEnvironment());
    reviewState.nextReviewEndpoint=endpoint;await saveMap(map);
    // This is the real replacement review tab, created before closing a possibly last tab.
    if(previous){
      if(!previous.closed)await herdr.close(previous.tab);previous.closed=true;
      reviewState.reviewHistory=[...(reviewState.reviewHistory||[]),previous];
    }
    const name=shortName(mapId,`${issueId||'final'}-${randomUUID()}`,'review');
    const taskFile=path.join(stateRoot(),'assignments',`${name}.json`);
    await atomic(taskFile,{mapId,issueId:issueId||null,role:'reviewer',reviewer:name,worktree:cwd,head});
    const reviewer={...endpoint,name,assignment:taskFile,head,ready:false};
    delete reviewState.nextReviewEndpoint;
    if(issue){issue.reviewer=reviewer;issue.status='reviewing';}else map.reviewer=reviewer;
    await saveMap(map);
    await herdr.start(name,'pi',endpoint.pane,['-e',path.join(sourceRoot,'extensions/index.ts'),'--harness-assignment',taskFile]);
    reviewer.ready=true;await saveMap(map);
    const skill=issue?'':`Read and apply ${path.join(sourceRoot,'skills/no-mistakes/SKILL.md')}. This is the final no-mistakes map gate.`;
    await herdr.prompt(name,[`You are the independent reviewer ${name}. Review ${issueId||'the entire map'} in ${cwd}.`,
      `Compare ${issue?.baseCommit||map.baseCommit||map.base}...${head}. Check correctness, regressions, requirements, tests, and integration.`,
      `Map intent and issue acceptance criteria: ${JSON.stringify({title:map.title,issues:map.issues.map(i=>({id:i.id,title:i.title,body:i.body,acceptance:i.acceptance,summary:i.summary}))})}`,
      issue?'Do not edit code, merge, push, or open a PR. Use read-only review and relevant tests. Report actionable findings with file/line evidence.':'Do not edit source directly, merge, push, or open a PR. Drive no-mistakes local validation, allowing the pipeline to own fixes and guarded branch synchronization. Skip only push,pr,ci. Read the skill before starting.',skill,
      issue?`Report with fm_review: head=${head}, verdict=pass or changes, summary=your findings and verification. Never report pass without completing the review.`:'After any pipeline fixes and guarded synchronization, read the current full HEAD and report that value through fm_review. Include gate outcome and verification in the summary; never reuse a stale pre-pipeline HEAD.'].join('\n\n'));
    return reviewer;
  });
  await cleanupDeferred(mapId,herdr);return dispatched;
}
export async function askCrew(mapId,issueId,question) {
  if(!question?.trim())throw new Error('Question text required');
  return locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issue||!['working','changes-requested'].includes(issue.status))throw new Error('Only active workers may ask questions');
    const row=await event(mapId,issueId,'question',{question});
    issue.question={id:row.id,text:question};issue.status='waiting';await saveMap(map);return row;
  });
}
export async function askGate(mapId,question){
  if(!question?.trim())throw new Error('Question required');
  return locked(mapId,async()=>{const map=await loadMap(mapId);if(!map.reviewer)throw new Error('Final reviewer missing');const row=await event(mapId,null,'question',{question,reviewer:map.reviewer.name});map.gateQuestion={id:row.id,text:question};await saveMap(map);return row;});
}
export async function answerCrew(mapId,issueId,answer,herdr=new Herdr()) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issueId){
      if(!map.gateQuestion||!map.reviewer||!answer?.trim())throw new Error('No final gate question or empty answer');
      map.gateQuestion.answer=answer;await saveMap(map);
      await herdr.prompt(map.reviewer.name,`Firstmate answer to ${map.gateQuestion.id}:\n${answer}\nContinue driving the existing no-mistakes run.`);return map;
    }
    if(!issue||issue.status!=='waiting')throw new Error('Worker not waiting for a question');
    if(!answer?.trim())throw new Error('Answer text required');
    issue.question.answer=answer;issue.status='working';await saveMap(map);
    try{await herdr.prompt(issue.worker.name,`Firstmate's answer to question ${issue.question.id}:\n${answer}\nContinue the assigned work.`);}
    catch(error){await event(mapId,issueId,'failed',{message:'Answer saved but prompt delivery uncertain; inspect worker before retry.',error:error.message});throw error;}
    return issue;
  });
}
