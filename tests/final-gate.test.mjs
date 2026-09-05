import test from 'node:test';
import assert from 'node:assert/strict';
import {decode,encode} from '@toon-format/toon';
import {validateGateEvidence} from '../src/final-gate.mjs';
const expected={branch:'codex/map-example',head:'a'.repeat(40)};
function fixture(){return {run:{id:'run-1',branch:expected.branch,head_sha:expected.head,status:'passed',steps:[...['rebase','review','test','document','lint'].map(step=>({step,status:'passed'})),...['push','pr','ci'].map(step=>({step,status:'skipped'}))]}};}
test('accept actual structured local gate evidence for the exact branch and head',()=>{
  assert.equal(validateGateEvidence(decode(encode(fixture())),expected).runId,'run-1');
});
test('reject stale, missing, skipped local checks and unintended publication',()=>{
  const stale=fixture();stale.run.head_sha='b'.repeat(40);assert.throws(()=>validateGateEvidence(stale,expected),/match/);
  const skipped=fixture();skipped.run.steps[2].status='skipped';assert.throws(()=>validateGateEvidence(skipped,expected),/test/);
  const published=fixture();published.run.pr='https://example.invalid/pr/1';assert.throws(()=>validateGateEvidence(published,expected),/publication/);
  assert.throws(()=>validateGateEvidence({other_branch_run:fixture().run},expected),/match/);
});
