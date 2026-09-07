# Run this on your Mac

This is the requested handoff for macOS verification. Use a disposable repository for model-driven tests. Record PASS/FAIL and evidence for each section; do not count the Windows-host review as a Mac result.

## 1. Install and run automated checks

Open this harness folder in a terminal on the Mac. Do not copy Windows node_modules.

```sh
node scripts/install-macos.mjs
herdr --session pi-harness-mac-check
```

In another terminal in the harness folder:

```sh
node scripts/macos-validate.mjs --session pi-harness-mac-check
```

Expected: environment, behavior, Herdr config and Herdr contract checks pass. Evidence is written to `.runtime/macos-validation/`. The contract check creates and removes its own temporary workspace; it never reads your other panes. Missing Claude Code, Codex, gh, Bun or Chrome is reported by the doctor. Install/authenticate the clients you intend to use, then rerun the failed checks. Herdr requires each worker to reach its normal interactive prompt; resolve first-run onboarding before dispatch.

The installer sets `agent: pi` only when no no-mistakes global config exists. It preserves existing configuration. `no-mistakes doctor` must confirm a runnable backend before the final gate.

## 2. Verify global loading and roles

- [ ] From an existing repository in the test Herdr session, run `pi`, then `/harness`. Expected: main role and the global harness home, without copying the project.
- [ ] Repeat from a nested directory and a repository path with spaces. Expected: the same repository's map status is visible.
- [ ] Open `/grill-with-docs`, `/wayfinder`, `/to-spec`, and `/to-tickets`. Expected: their skills load; Firstmate delegates repository research and document work. Existing decisions are preserved.
- [ ] Ask Firstmate to create a small test map with two dependent issues. Expected: one map branch, one Herdr workspace, and the first worker in the workspace's default tab.
- [ ] Run Pi, Claude Code and Codex as crews across small issues. Expected: each works in its own native Git worktree and reports through the appropriate tool or CLI. No issue opens a PR or pushes.
- [ ] Main has no todo or implementation tools. Pi crews have todo, FFF, Chrome tools and `/simplify`; Claude/Codex crews receive todo/report CLI commands.

## 3. Questions and supervision

- [ ] Give a crew a question already answered in the map context. Expected: Firstmate answers it without asking you again, and the correct crew resumes.
- [ ] Give a crew a simple unresolved preference. Expected: Firstmate uses the structured question overlay. The worker pauses until answered.
- [ ] Ask a complex UI question. Expected: a crew creates a focused Show-me artifact, Firstmate opens it in Lavish, and the status lists the waiting page. Your reply returns through supervision to the correct map.
- [ ] Send a message to Firstmate while a crew is working. Expected: Firstmate remains responsive.
- [ ] Produce a routine progress event. Expected: its context is available on the next main turn without causing an extra model turn. Completion, questions, blocked workers and review results cause orchestration wakes.
- [ ] Restart the main Pi session after an event has been acknowledged. Expected: it is not reprocessed. Restart while a visual question is waiting; expected: waiting status/polling resumes.
- [ ] Open a second Firstmate for the same repository. Expected: one supervisor owns fleet polling; the other shows standby.

## 4. Terminal and browser UI

- [ ] Calm defaults on. Prompt and final output stay visible; middle thinking/building is quiet. `/calm` toggles only that middle presentation.
- [ ] Several read/bash operations form compact tool groups with running/done/failure indicators. Clicking expands/collapses them. The accepted interaction conflict with Herdr click-to-copy is not a regression.
- [ ] Powerline footer shows model, thinking level, project, branch and context usage. Narrowing WezTerm does not crash or draw outside its width.
- [ ] Final-output cards remain inside Pi's terminal. There is no separate browser conversation view.
- [ ] A Pi crew uses Chrome DevTools to inspect a local test UI, runs FFF searches, and applies `/simplify` only to its assigned changes.

## 5. Full Herdr Annotate

Reload the intended Herdr session's config after installation. With the default Ctrl+B prefix:

- [ ] Prefix+A opens annotation for selected terminal text.
- [ ] Prefix+Shift+A copies annotation context; paste into a scratch buffer and check the result.
- [ ] Prefix+M manages existing annotations.
- [ ] Prefix+O opens document review for the focused pane's folder.
- [ ] Prefix+Shift+O reviews the agent's last reply.
- [ ] Ctrl-click a local Markdown `file://` link. Expected: document review opens; submitted feedback reaches the intended agent.

## 6. Review, cleanup and delivery

- [ ] Completing an issue launches a different reviewer. Changes after approval require a fresh review.
- [ ] After review and merge, the branch/worktree and Herdr worker are cleaned up. **No holder tab is created.** If closing the final tab would remove a workspace still needed for work, cleanup waits for a real successor worker/final-review tab and then completes.
- [ ] Fail a worker launch once. Expected: retry preserves its worktree and opens a real replacement before closing the failed tab; no duplicate assignment is sent.
- [ ] Make parallel issues conflict. Expected: integration is aborted cleanly and repair is assigned back to a crew on its issue branch, followed by another review.
- [ ] Finish all issues. Expected: the independent final reviewer runs actual no-mistakes with `--skip push,pr,ci`, retaining local validation phases. User decisions at gates return through Firstmate.
- [ ] Verify the recorded gate branch and full HEAD match the map's current HEAD. A failed, stale, absent or locally skipped check must block shipping.
- [ ] In a disposable remote, let Firstmate ship. Expected: one exact reviewed map commit is pushed to main/master without force; no per-issue PR. A remote advancement requires renewed integration and review.

## 7. Terminal style check

The latest regular-mode implementation supersedes the earlier fullscreen/pointer checks below. Use [regular output acceptance](regular-output.md), including native scrollback and image-protocol validation. Regular mode uses keyboard expansion; the live prompt bar does not remain pinned while scrolling native terminal history.

- [ ] Follow [global appearance setup](global-appearance.md) to install the Nerd Font and load the WezTerm module. Select `firstmate` in Pi `/settings` if retaining a previous custom theme.
- [ ] Launch plain `pi` from a different project folder, without `-e`. Confirm `/harness` works, the theme is discovered, and only the main agent shows team groups. Crew/review work sessions should expose todo instead.

- [ ] Run `/harness-style-preview`. Confirm the short prompt strip, filled output panel, dark code area, purple extension-output heading, and colored powerline match the supplied references as a terminal adaptation.
- [ ] Press Tab to inspect grouped tools and crew/status examples, then Space to expand tools. Enter/Esc must return to the normal editor. These examples are synthetic and make no model calls.
- [ ] Run `/harness-style-preview narrow` to check 48-column wrapping. At limited widths, text and powerline segments truncate; borders must stay aligned.
- [ ] In normal operation, verify the powerline is on the input's top border, with actual model, thinking, directory, branch, tracked-change/untracked counts and context usage. Check completion, multiline scrolling, paste, Escape and model switching.
- [ ] Click a real tool group to expand/collapse it. Confirm the accepted Herdr click-to-copy conflict behaves as expected. The keyboard fixture does not validate mouse routing.
- [ ] Verify the chosen WezTerm font renders Pi, branch, separator and status symbols. Browser transparency, rounded CSS corners and browser copy buttons are not reproduced by the terminal adaptation.

## 8. Update and rollback

- [ ] Install a second harness release, then run `node scripts/install-macos.mjs --rollback` and restart Pi. Expected: previous package loads while project work, map state and unrelated Pi settings remain.
- [ ] Keep annotation/no-mistakes binary rollback separate, as described in upstream-maintenance.md.

Attach `.runtime/macos-validation/report.json` and concise failing-step observations when reporting problems. Keep authentication files and credentials out of reports.

### Mouse regression acceptance

- After `/reload`, wheel-scroll native history and drag-select text without holding Shift. Verify Herdr's usual tab/workspace and copy interactions.
- `/harness-mouse` opts into temporary tool clicks; click a header to expand/collapse. Escape returns to native mouse mode.
- In temporary capture, the first wheel tick releases capture and later ticks scroll. Verify no mouse escape text appears in the editor.
- Open a question dialog and confirm keyboard input is retained. Restart/reload and verify capture stays off.

### Transcript cards supersede the sticky-prompt checks above

Restart Pi, then run `/harness-cards-check`. Confirm cyan prompt, pink reply, purple extension boxes, interior-only fill and clear gaps. Scroll normally: the prompt card must scroll away with the transcript, with no fixed copy across reply text. Sticky overlays are no longer used in regular mode.
