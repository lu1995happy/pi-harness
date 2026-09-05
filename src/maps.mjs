import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { git, run } from './process.mjs';
import { id, locked, stateRoot, loadMap, saveMap, event, readJson } from './store.mjs';
import { verifyFinalGate } from './final-gate.mjs';
import {Herdr} from './herdr.mjs';

export async function createMap({ mapId, repo, title, issues, base }) {
  id(mapId);
  return locked(mapId, async () => {
    if (await readJson(path.join(stateRoot(),'maps',`${mapId}.json`),null)) throw new Error('Map already exists');
    repo = await fs.realpath(await git(repo,'rev-parse','--show-toplevel'));
    if (!base) {
      for (const candidate of ['main','master']) {
        if ((await run('git',['show-ref','--verify','--quiet',`refs/heads/${candidate}`],{cwd:repo,allowFailure:true})).code === 0) { base=candidate; break; }
      }
    }
    if (!['main','master'].includes(base)) throw new Error('Select an existing main or master base branch');
    const seen = new Set();
    if (!Array.isArray(issues) || !issues.length) throw new Error('Map requires issues');
    for (const issue of issues) { id(issue.id); if(issue.id==='map')throw new Error('Issue ID map is reserved for the integration worktree');if(seen.has(issue.id)) throw new Error('Duplicate issue ID'); seen.add(issue.id); if(!issue.title) throw new Error('Issue title required'); }
    for (const issue of issues) for (const dep of issue.dependsOn || []) if(!seen.has(dep) || dep===issue.id) throw new Error('Invalid dependency');
    const visit=(key,stack=new Set(),done=new Set())=>{if(stack.has(key))throw new Error('Dependency cycle');if(done.has(key))return;stack.add(key);for(const dep of issues.find(i=>i.id===key).dependsOn||[])visit(dep,stack,done);stack.delete(key);done.add(key);};
    issues.forEach(i=>visit(i.id));
    const branch = `codex/map-${mapId}`;
    const worktree = path.join(stateRoot(),'worktrees',mapId,'map');
    await fs.mkdir(path.dirname(worktree),{recursive:true});
    await git(repo,'worktree','add','-b',branch,worktree,base);
    const map={id:mapId,title:title||mapId,repo,base,baseCommit:await git(worktree,'rev-parse','HEAD'),branch,worktree,status:'active',issues:issues.map(i=>({...i,dependsOn:i.dependsOn||[],status:'pending',reviews:[]})),createdAt:new Date().toISOString()};
    await saveMap(map);return map;
  });
}
export async function prepareIssue(mapId,issueId,kind='pi') {
  id(issueId); if(!['pi','claude','codex'].includes(kind))throw new Error('Unsupported worker kind');
  return locked(mapId,async()=>{
    const map=await loadMap(mapId);const issue=map.issues.find(i=>i.id===issueId);
    if(!issue || issue.status!=='pending')throw new Error('Issue is not pending');
    if(issue.dependsOn.some(d=>map.issues.find(i=>i.id===d).status!=='merged'))throw new Error('Issue dependencies are not merged');
    const branch=`codex/${shortName(mapId,issueId,'crew')}-${issueId}`;const worktree=path.join(stateRoot(),'worktrees',mapId,issueId);
    await git(map.repo,'worktree','add','-b',branch,worktree,map.branch);
    Object.assign(issue,{branch,worktree,kind,status:'prepared',baseCommit:await git(map.worktree,'rev-parse','HEAD')});
    await saveMap(map);return issue;
  });
}
export async function addIssues(mapId,issues) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId);if(map.status!=='active')throw new Error('Map is not active');
    if(map.reviewer&&!map.reviewer.completed)throw new Error('Wait for the active final gate before adding follow-up issues');
    if(!Array.isArray(issues)||!issues.length)throw new Error('Provide follow-up issues');
    const all=[...map.issues,...issues],seen=new Set();
    for(const issue of all){id(issue.id);if(issue.id==='map'||seen.has(issue.id)||!issue.title)throw new Error('Invalid or duplicate issue');seen.add(issue.id);}
    const visiting=new Set(),done=new Set();
    const visit=key=>{if(visiting.has(key))throw new Error('Dependency cycle');if(done.has(key))return;const row=all.find(i=>i.id===key);if(!row)throw new Error('Unknown dependency');visiting.add(key);for(const dep of row.dependsOn||[])visit(dep);visiting.delete(key);done.add(key);};
    all.forEach(issue=>visit(issue.id));
    map.issues.push(...issues.map(issue=>({...issue,status:'pending',reviews:[],dependsOn:issue.dependsOn||[]})));
    map.finalReview=null;await saveMap(map);return map;
  });
}
export async function completeIssue(mapId,issueId,summary) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issue||!['working','prepared','changes-requested'].includes(issue.status))throw new Error('Issue is not active');
    if(await git(issue.worktree,'status','--porcelain'))throw new Error('Commit worker changes before reporting completion');
    issue.head=await git(issue.worktree,'rev-parse','HEAD');issue.status='awaiting-review';issue.summary=summary;
    await saveMap(map);await event(mapId,issueId,'completed',{summary,head:issue.head});return issue;
  });
}
export async function reviewIssue(mapId,issueId,{reviewer,head,verdict,summary}) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issue||issue.status!=='reviewing'||!issue.reviewer||reviewer!==issue.reviewer.name)throw new Error('Review must come from the assigned separate reviewer');
    if(head!==issue.head||head!==await git(issue.worktree,'rev-parse','HEAD'))throw new Error('Review refers to stale code');
    if(!['pass','changes'].includes(verdict))throw new Error('Invalid review verdict');
    issue.reviews.push({reviewer,head,verdict,summary,at:new Date().toISOString()});issue.status=verdict==='pass'?'reviewed':'changes-requested';
    await saveMap(map);await event(mapId,issueId,'reviewed',{verdict,summary});return issue;
  });
}
export async function mergeIssue(mapId,issueId) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issue||issue.status!=='reviewed')throw new Error('Issue has not passed separate review');
    if(issue.head!==await git(issue.worktree,'rev-parse','HEAD'))throw new Error('Changes after review require another review');
    if(await git(map.worktree,'status','--porcelain')||await git(issue.worktree,'status','--porcelain'))throw new Error('Integration and issue worktrees must be clean');
    try{await git(map.worktree,'merge','--no-ff','--no-edit',issue.branch);}
    catch(error){
      const abort=await run('git',['merge','--abort'],{cwd:map.worktree,allowFailure:true});
      if(await git(map.worktree,'status','--porcelain'))throw new Error(`Integration failed and needs inspection in ${map.worktree}: ${error.message}; abort: ${abort.stderr}`);
      const summary=`Integration failed: ${error.message}. Incorporate ${map.branch} into your issue branch, resolve conflicts there, test and report completion for a fresh independent review.`;
      issue.status='changes-requested';issue.reviews.push({reviewer:'integration',head:issue.head,verdict:'changes',summary,at:new Date().toISOString()});
      await saveMap(map);await event(mapId,issueId,'failed',{summary});throw new Error(summary);
    }
    issue.status='merged';issue.mergeCommit=await git(map.worktree,'rev-parse','HEAD');map.finalReview=null;
    await saveMap(map);return issue;
  });
}
export async function cleanupIssue(mapId,issueId,herdr) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId),issue=map.issues.find(i=>i.id===issueId);
    if(!issue||issue.status!=='merged')throw new Error('Only merged issues can be cleaned up');
    if(issue.cleaned)return issue;
    const root=await fs.realpath(path.join(stateRoot(),'worktrees',mapId));
    if(!path.resolve(issue.worktree).startsWith(root+path.sep))throw new Error('Worktree outside owned map directory');
    await git(map.repo,'merge-base','--is-ancestor',issue.head,map.branch);
    const exists=await fs.access(issue.worktree).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
    if(exists){
      if(await git(issue.worktree,'status','--porcelain'))throw new Error('Worktree has uncommitted changes');
      if(await git(issue.worktree,'rev-parse','HEAD')!==issue.head)throw new Error('Worktree changed after merge; preserve and review its new commits');
    }
    // Stop our worker tabs before removing their checkout. Never remove unknown tabs.
    const endpoints=[issue.worker,issue.reviewer,...(issue.reviewHistory||[])].filter(endpoint=>endpoint?.tab&&!endpoint.closed);
    if(map.herdr&&endpoints.length){
      const tabs=await herdr.tabs(map.herdr.workspace),closing=new Set(endpoints.map(endpoint=>endpoint.tab));
      const successorNeeded=map.status!=='shipped'&&map.finalReview?.verdict!=='pass';
      if(successorNeeded&&tabs.length&&tabs.every(tab=>closing.has(tab.tab_id))){
        issue.cleanupDeferred=true;await saveMap(map);return issue;
      }
      // Tabs closed manually no longer need a close operation.
      for(const endpoint of endpoints)if(!tabs.some(tab=>tab.tab_id===endpoint.tab))endpoint.closed=true;
    }
    for(const endpoint of endpoints)if(!endpoint.closed){await herdr.close(endpoint.tab);endpoint.closed=true;await saveMap(map);}
    if(exists)await git(map.repo,'worktree','remove',issue.worktree);
    issue.worktreeRemoved=true;await saveMap(map);
    const branchExists=(await run('git',['show-ref','--verify','--quiet',`refs/heads/${issue.branch}`],{cwd:map.repo,allowFailure:true})).code===0;
    if(branchExists){
      if(await git(map.repo,'rev-parse',issue.branch)!==issue.head)throw new Error('Issue branch changed after merge; refusing deletion');
      await git(map.worktree,'branch','-d',issue.branch);
    }
    issue.cleaned=true;issue.cleanupDeferred=false;await saveMap(map);return issue;
  });
}
export async function cleanupDeferred(mapId,herdr){
  const map=await loadMap(mapId);
  for(const issue of map.issues.filter(i=>i.cleanupDeferred&&!i.cleaned)){
    try{await cleanupIssue(mapId,issue.id,herdr);}
    catch(error){await event(mapId,issue.id,'failed',{message:'Deferred cleanup needs inspection',error:error.message});}
  }
}
export async function finalReview(mapId,{reviewer,head,verdict,summary}) {
  return locked(mapId,async()=>{
    const map=await loadMap(mapId);
    if(map.issues.some(i=>i.status!=='merged'))throw new Error('All issues must be merged first');
    if(!map.reviewer||map.reviewer.name!==reviewer)throw new Error('Assigned no-mistakes reviewer required');
    if(head!==await git(map.worktree,'rev-parse','HEAD'))throw new Error('Final review is stale');
    if(!['pass','changes'].includes(verdict))throw new Error('Invalid final verdict');
    if(await git(map.worktree,'status','--porcelain'))throw new Error('Final map worktree must be clean');
    const evidence=verdict==='pass'?await verifyFinalGate(map,head):null;
    map.finalReview={reviewer,head,verdict,summary,evidence,skill:'no-mistakes',at:new Date().toISOString()};
    map.reviewer.completed=true;
    await saveMap(map);await event(mapId,null,'final-review',map.finalReview);return map;
  });
}
export async function shipMap(mapId,herdr=new Herdr()) {
  const shipped=await locked(mapId,async()=>{
    const map=await loadMap(mapId),head=await git(map.worktree,'rev-parse','HEAD');
    if(map.finalReview?.verdict!=='pass'||map.finalReview.head!==head||map.finalReview.evidence?.head!==head)throw new Error('Current map head needs green no-mistakes review');
    if(await git(map.worktree,'status','--porcelain'))throw new Error('Map worktree must be clean');
    await git(map.repo,'fetch','origin',map.base);
    const remote=await git(map.repo,'rev-parse',`refs/remotes/origin/${map.base}`);
    await git(map.repo,'merge-base','--is-ancestor',remote,head);
    // Push exact reviewed commit, no force. Remote advancement requires rebase/merge and a new review.
    await git(map.repo,'push','origin',`${head}:refs/heads/${map.base}`);
    map.status='shipped';map.shippedHead=head;await saveMap(map);return map;
  });
  await cleanupDeferred(mapId,herdr);
  if(shipped.herdr){
    try{
      await locked(mapId,async()=>{
        const map=await loadMap(mapId);
        for(const endpoint of [map.reviewer,...(map.reviewHistory||[])])if(endpoint?.tab&&!endpoint.closed){await herdr.close(endpoint.tab);endpoint.closed=true;await saveMap(map);}
      });
    }catch(error){shipped.cleanupWarning=`Map shipped, but final tab cleanup needs inspection: ${error.message}`;}
  }
  return {...await loadMap(mapId),...(shipped.cleanupWarning?{cleanupWarning:shipped.cleanupWarning}:{})};
}
export const shortName = (mapId,issueId,role) => `${role}-${createHash('sha256').update(`${mapId}:${issueId}`).digest('hex').slice(0,16)}`;
