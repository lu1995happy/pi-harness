import test from 'node:test';
import assert from 'node:assert/strict';
import {rolePresentation} from '../src/roles.mjs';
test('team display belongs only to main; todos belong to work sessions, not the event supervisor',()=>{
  assert.deepEqual(rolePresentation('main'),{team:true,todo:false});
  for(const role of ['crew','reviewer','pipeline','background'])assert.deepEqual(rolePresentation(role),{team:false,todo:true});
  assert.deepEqual(rolePresentation('supervision'),{team:false,todo:false});
});
