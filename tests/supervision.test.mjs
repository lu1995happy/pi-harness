import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {event,recordOutcome} from '../src/store.mjs';
import {acknowledge,isAcknowledged,shouldDeliver,acquireSupervisor,releaseSupervisor} from '../src/supervision-state.mjs';
import {publishVisualResponse,visualPages} from '../src/visual-pages.mjs';
import {pendingEvents} from '../src/store.mjs';
before(async()=>{process.env.PI_HARNESS_HOME=await fs.mkdtemp(path.join(os.tmpdir(),'pi-supervision-'));});
after(()=>{delete process.env.PI_HARNESS_HOME;});
test('actionable events remain eligible until durable acknowledgement, without poll-frequency wakes',async()=>{
  const row=await event('example','issue','completed',{summary:'done'});row.verdict='orchestration';await recordOutcome(row);
  assert.equal(shouldDeliver(row,{lastAttempt:1000,now:1500}),false);
  assert.equal(shouldDeliver(row,{lastAttempt:1000,now:61000}),true);
  assert.equal(shouldDeliver(row,{lastAttempt:61000,now:121000}),true);
  await assert.rejects(acknowledge([row.id],['unrelated']),/another repository/);
  await acknowledge([row.id],['example']);
  assert.equal(await isAcknowledged(row.id),true);
  assert.equal(shouldDeliver(row,{acknowledged:await isAcknowledged(row.id),now:999999}),false);
  await assert.rejects(acknowledge(['../escape'],['example']),/Invalid/);
});
test('routine delivery does not repeat in the same session',()=>{
  assert.equal(shouldDeliver({verdict:'routine'},{delivered:true}),false);
  assert.equal(shouldDeliver({verdict:'routine'},{lastAttempt:1}),false);
  assert.equal(shouldDeliver({verdict:'routine'}),true);
});
test('only one coordinator owns a repository, including sessions within one process',async()=>{
  const key='a'.repeat(64);
  assert.equal(await acquireSupervisor(key,'one'),true);
  assert.equal(await acquireSupervisor(key,'two'),false);
  await releaseSupervisor(key,'two');
  assert.equal(await acquireSupervisor(key,'two'),false);
  await releaseSupervisor(key,'one');
  assert.equal(await acquireSupervisor(key,'two'),true);
  await releaseSupervisor(key,'two');
});
test('replaying visual-response publication retains one durable event',async()=>{
  const row={id:'12345678-1234-1234-1234-123456789abc',mapId:'visual',file:'/question.html',title:'Choose UI',status:'responded',feedback:'Use option A'};
  await publishVisualResponse(row);await publishVisualResponse(row);
  const events=await pendingEvents(['visual']);assert.equal(events.length,1);assert.equal(events[0].detail.feedback,'Use option A');
  assert.equal((await visualPages())[0].notified,true);
});
