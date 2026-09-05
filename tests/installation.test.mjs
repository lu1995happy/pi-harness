import test from 'node:test';
import assert from 'node:assert/strict';
import {activationSettings} from '../scripts/install-macos.mjs';
test('activation preserves model and unrelated package configuration and supports rollback',()=>{
  const initial={defaultModel:'my-model',packages:['npm:unrelated@1',{source:'/old',extensions:['*']}],custom:true};
  const updated=activationSettings(initial,'/new','/old');
  assert.deepEqual(updated,{defaultModel:'my-model',packages:['npm:unrelated@1','/new'],custom:true,tuiMode:'fullscreen'});
  assert.deepEqual(activationSettings(updated,'/old','/new').packages,['npm:unrelated@1','/old']);
  assert.deepEqual(activationSettings(updated,'/new','/old'),updated);
  assert.equal(initial.packages.length,2);
});
