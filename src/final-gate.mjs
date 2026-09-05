import { decode } from '@toon-format/toon';
import { run } from './process.mjs';

export function validateGateEvidence(body,{branch,head}) {
  const gate=body?.run;
  if(body?.error||!gate||gate.branch!==branch||gate.head_sha!==head)throw new Error('No-mistakes evidence does not match this map branch and HEAD');
  if(gate.status!=='passed')throw new Error(`No-mistakes has not passed: ${gate.status}`);
  if(!Array.isArray(gate.steps))throw new Error('No-mistakes step evidence missing');
  for(const name of ['rebase','review','test','document','lint']) {
    if(!gate.steps.some(step=>step.step===name&&step.status==='passed'))throw new Error(`No-mistakes local step is not green: ${name}`);
  }
  if(gate.pr)throw new Error('Unexpected PR publication in the local map gate');
  for(const name of ['push','pr','ci']) {
    const step=gate.steps.find(step=>step.step===name);
    if(step&&step.status!=='skipped')throw new Error(`Map publication must remain with Firstmate: ${name}`);
  }
  return {runId:gate.id,head:gate.head_sha,branch:gate.branch,steps:gate.steps,checkedAt:new Date().toISOString()};
}
export async function verifyFinalGate(map,head) {
  const output=await run('no-mistakes',['axi','status'],{cwd:map.worktree,timeout:30000});
  return validateGateEvidence(decode(output.stdout),{branch:map.branch,head});
}
