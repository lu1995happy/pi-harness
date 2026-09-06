# Implementation progress

Status: Implementation prepared for macOS handoff; application acceptance and the latest model-backed Pi review remain pending. Requirements are captured in `docs/requirements.md` and `docs/ui-and-extensions.md`. Runnable handoff: `docs/macos-checklist.md`.

## Work plan

- [x] Locate Pi 0.85.0, Herdr 0.8.2, WezTerm, Node and Git; inspect Pi SDK and Herdr command interfaces. Other worker CLI availability remains to verify.
- [x] Inspect selected upstream implementations and record provenance/adoption boundaries in upstream.json.
- [x] Build macOS global installer/rollback, configuration, role loading, and component layout (macOS execution pending).
- [x] Implement map/worktree lifecycle, Herdr workspace/tab management, and crew adapters.
- [x] Adapt Pi main/background supervision and question routing (live model behavior needs Mac acceptance checks).
- [x] Implement terminal UI, calm, footer, status groups, and selected coding helpers (Mac visual acceptance pending).
- [x] Test failure handling, isolation, review/integration, and cleanup through eighteen deterministic tests.
- [ ] Review using local Pi + Herdr; fix findings and retain review evidence.
- [ ] Install globally and verify from an existing project; finalize update/rollback guidance.

## Decisions and findings

- Pi coordinates and supervises; crews may use Pi, Claude Code, or Codex.
- Terminal contains prompt, middle activity, and final output. Calm only changes middle activity.
- Reuse selected upstream pieces; retain Firstmate-derived scripts in a dedicated folder.
- Initial shell discovery finds Node and Git but does not find Pi, Herdr, WezTerm, npm, or gh on this tool process's PATH. Installed application locations are being inspected before treating anything as missing.

## Verification record

- Native Git lifecycle: 3 tests passing (invalid/cyclic maps, issue isolation/dependency/review/merge/cleanup, concurrent mutation lock).
- Core map CLI, crew controller, Pi role tools, supervision session adapter, calm and terminal rendering are implemented but not yet fully validated.
- Pinned project dependencies installed for structured questions, FFF, Chrome DevTools, and Lavish; selected Firstmate/tool-display source retained under `components/` with licenses.
- Local Herdr review workspace created as w2, using its default w2:t1 / w2:p1. First startup found Herdr's Windows `Start-Process pi` failure; explicit pi.cmd fallback is being verified.
- Herdr can return empty stdout for successful pane commands; adapter parsing needs adjustment.
- After the latest user continuation, Herdr reports its default server is not running. Inspect/restart a dedicated review session before continuing runtime checks.
- User additionally requested installation of plannotator/herdr-annotate. Inspect platform dependencies, install, bind keys, and verify loading.
- Installed herdr-annotate 0.3.0 pinned at bccf884b874f5f39ccbef1bb6ac67625c5fb5d54 and Bun 1.4.2; Herdr config check passes. Windows supports capture, copy-context and manage; upstream excludes document/reply review on Windows.
- Dedicated named Herdr session `pi-harness-review` now runs Pi 0.85.0 with the extension loaded. Lifecycle hook reports idle. Adapter corrected to read `agent_status` from live responses.
- First implementation review dispatched to that Pi session; findings pending.

## Next action

macOS is the primary target for every package/extension following the user's correction. Finish global macOS installation, upstream skill integration, supervision reliability, and application review. Do not treat Windows smoke checks as macOS validation.

## macOS correction and follow-up

- Removed the mandatory Windows-only Bun dependency; it is optional and skipped on incompatible platforms.
- Worker report commands now quote for macOS POSIX shells; PATH enrichment no longer adds the current directory when a CLI is resolved through PATH.
- Map workspace remains rooted in the stable map worktree. Its default tab changes to the first issue worktree with platform-correct quoting and a unique output acknowledgement before agent startup.
- Added `scripts/install-annotate-macos.mjs` for the full pinned plugin, all five bindings, conflict detection, config backup and validation rollback. Native plugin installation has NOT run on a Mac.
- Added `docs/macos.md` with installation and application acceptance checks.
- Local Pi + Herdr review completed and identified portability, supervision delivery, missing final-review skill, and routing gaps. This was a development review, not a green final gate.
- Corrected repository matching to use Git's canonical common directory: launches from subdirectories and linked worktrees now match; macOS paths are no longer unconditionally lowercased. Crew status uses the same repository scope.
- macOS runtime verification is pending access to a Mac. Windows-local verification remains separate.
- Seven host tests pass after the macOS corrections. Second local Pi + Herdr review completed; it found first-tab cwd lifetime and startup-recovery gaps. Stable workspace cwd corrected; startup recovery remains to address. The questioned HERDR_CONFIG_PATH override is confirmed by installed Herdr --help.
- Added a macOS-only environment doctor for the three worker CLIs, Pi/Herdr/WezTerm, Git/gh, Bun, Chrome, and installed package platform metadata.

## Continued implementation

- Added durable supervision acknowledgements, retry pacing without a two-attempt cutoff, one coordinator per repository, and provider-error fallback to actionable main-session events.
- Added all four planning skill adaptations, Show-me integration guidance, final no-mistakes skill adapter, and crew-only Simplify. Preserved source attribution and licenses.
- Final review now independently parses no-mistakes TOON status and requires matching branch/HEAD plus green local steps. Publication steps remain skipped in that pipeline; Firstmate ships afterward.
- Added worker startup recovery, prompt-delivery uncertainty events, reviewer/gate questions, crew tool pauses while awaiting answers, and resumable cleanup with post-merge commit protection.
- Added durable Lavish page records and supervision events instead of direct model wakeups.
- Added macOS versioned release installer and rollback, pinned no-mistakes 1.64.0 archive digests for arm64/x64, full annotation installation, global package activation, README and upstream inventory.
- Fourteen deterministic tests pass. The newest harness loads successfully in local Pi + Herdr and displays supervision and the powerline footer.
- Third Pi review did not complete: the local Pi provider reported "usage limit reached". No usage credit was consumed and no billing settings were changed. Further model-backed local review is pending provider availability.
- Automatic approval review rejected a read of w1:p1 due to its prior association with the user's main workspace. No read was performed; subsequent runtime checks use the recorded w2:p1 review pane only.
- macOS installation and interactive validation remain pending a Mac; an access/checklist question is outstanding. This is not a completed deployment.
- User chose a runnable checklist for their Mac; prepare it instead of waiting for remote access.
- Live Herdr contract check created only a dedicated test workspace, verified directory-change acknowledgement for spaces/apostrophes, and confirmed that closing the final tab deletes its workspace. Evidence: .runtime/herdr-contract-check.json.
- User rejected holder tabs. Cleanup now defers the last crew tab/worktree until a real successor worker or final-review tab exists, then drains deferred cleanup automatically after dispatch. No holder tab is created. Once final review is green or the map is shipped, last-tab cleanup is allowed.
- Real reviewer replacements are created before old reviewer tabs close. Shipped maps close their final reviewer tabs; other user tabs are never targeted.
- Added follow-up map issues, integration-conflict return to crews, shared todo CLI for Claude/Codex, and reviewer role isolation for no-mistakes pipeline agents.
- Mac handoff is complete: docs/macos-checklist.md and scripts/macos-validate.mjs. Host evidence is summarized in docs/reviews/host-validation.md. Eighteen tests currently pass.

## Style correction after user review

- Found that the initial generic outlined cards and plain footer did not adequately match the supplied references.
- Replaced the lower footer row with colored powerline segments in the input's top border, retaining Pi's CustomEditor controls. Added Git tracked-change and untracked counts with asynchronous status refresh.
- Added filled blue/purple output panels, cyan/purple headings and accents, compact prompt strip when space permits, and darker fenced-code surfaces. Default extension messages receive an EXTENSION OUTPUT panel. Conversation still stays in the terminal; calm still applies to intermediate activity.
- Added colored supervisor, per-map crew groups, and waiting visual-question status.
- Added `/harness-style-preview`: synthetic fixtures rendered locally by the actual Pi message and grouped-tool components, with Tab to switch panels/tools, Space to expand tools, and Enter/Esc to exit. No model request is made. `narrow` renders at 48 columns.
- Live Pi 0.85.1 + Herdr checks caught and fixed header ellipses, misplaced OSC133 shell markers, and preview key matching under the terminal keyboard protocol. Checked grouped-tool collapsed/expanded output. Eighteen functional tests passed during this correction.
- Color evidence is captured from the dedicated w2:p1 review pane only. PNGs are reconstructed from its ANSI output, not Mac screenshots; the reconstruction font lacks some terminal symbols. Actual Mac font rendering, pointer interactions, and a fresh model-backed review remain pending.

## Global activation and role visibility correction

- User's default-looking Pi screenshot exposed a real deployment gap: the Windows global settings had only model/provider settings, and prior checks used `-e`. Added `scripts/activate-local.mjs` and executed it with a settings backup, registering this owned source package globally and selecting the bundled firstmate theme. This host uses the source package for development; macOS still uses versioned global releases.
- Verified a plain Pi launch with no extension flags in a freshly created temporary folder outside the repository. Pi reported the globally discovered skills, harness extension, and firstmate theme and rendered the supervisor/powerline. No model request was needed.
- Added explicit role presentation policy: only main gets team/status UI; crews, reviewers, pipeline work sessions and background work agents get todo. Event-only supervision remains isolated. Review/background todo storage is separate from implementation crew tasks.
- Bundled a complete Pi theme so tools and dialogs no longer silently keep the default palette. Matched the selected upstream powerline palette values and icon codepoints; Nerd glyphs require explicit font support, with fallbacks otherwise.
- Added `config/wezterm-harness.lua` and Mac font setup instructions. Terminal fonts have not been changed on this Windows host. The upstream footer specifies Nerd Font support but does not establish the exact typeface in the user's screenshot.
- Nineteen tests pass, including main/worker/supervisor role visibility. macOS font and interaction checks remain pending.

## Border correction from supplied screenshots

- Joined the input's top-right corner and added matching side borders and short bottom end caps, replacing Pi's unrelated full-width bottom rule. The native editor still owns text wrapping, cursor markers, completion and scrolling; mouse coordinates account for the added left edge.
- Continued existing panel fill through border cells to remove black gutters around message content. Section headings now sit inside the panel instead of interrupting its top border; the left accent continues through both corners.
- Reloaded and inspected the actual dedicated Pi + Herdr pane, including the existing conversation and a 48-column fixture. ANSI reconstruction: `.runtime/border-review.png`. No terminal font or window-background configuration was changed in this correction.
