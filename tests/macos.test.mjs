import test from 'node:test';
import assert from 'node:assert/strict';
import { quoteForShell, shellCommand } from '../src/process.mjs';
import { addAnnotationBindings, annotationBindings } from '../scripts/install-annotate-macos.mjs';

test('macOS commands preserve spaces, apostrophes and shell metacharacters literally', () => {
  assert.equal(quoteForShell("/Users/me/My project's/$HOME`id`", 'darwin'), "'/Users/me/My project'\"'\"'s/$HOME`id`'");
  assert.equal(shellCommand('/opt/homebrew/bin/node', ['/Users/me/Project Folder/report.mjs', '{"question":"a $b"}'], 'darwin'), "'/opt/homebrew/bin/node' '/Users/me/Project Folder/report.mjs' '{\"question\":\"a $b\"}'");
});

test('full macOS annotations add all five bindings and are repeatable', () => {
  const original = 'onboarding = false\n';
  const result = addAnnotationBindings(original);
  for (const [, command] of annotationBindings) assert.ok(result.includes(`command = "${command}"`));
  assert.ok(result.startsWith(original));
  assert.equal(addAnnotationBindings(result), result);
});

test('annotation installer preserves custom action keys and rejects occupied defaults', () => {
  const custom = '[[keys.command]]\nkey = "prefix+x"\ntype = "plugin_action"\ncommand = "annotate.capture"\n';
  assert.ok(!addAnnotationBindings(custom).includes('key = "prefix+a"'));
  assert.throws(() => addAnnotationBindings("[[keys.command]]\nkey='prefix+o'\ncommand='something-else'\n"), /occupies prefix\+o/);
});
