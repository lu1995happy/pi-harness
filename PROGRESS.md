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

## Regular-mode output implementation — 2026-09-06

Follow-up correction: replaced the bottom last-prompt widget with a noncapturing row-1 overlay using Pi's regular-screen overlay API. Added actual SGR mouse press/release routing to group headers using the last completed component layout and viewport offset. Verified in a fresh dedicated Herdr workspace (w3:p1): captured prompt at row 1; click at row 19 expanded, second click collapsed; after 45 filler lines, click at row 26 expanded the intended group and the prompt stayed on row 1. Inspected `.runtime/interaction-expanded.png`, reconstructed from actual viewport ANSI colors. Mouse input was sent through Herdr's terminal input path, not by directly toggling the group. Expanded label now says “click to show less.” Regular mode and the existing global activation are retained. Native history selection/scrolling may need the terminal's mouse-bypass modifier. These checks supersede the earlier bottom-widget/keyboard-only acceptance claims.

- User explicitly requires normal screen. Changed global activation and macOS installer defaults to `tuiMode: regular`, and activated that setting on this host. Removed the forced fullscreen mouse hint. Existing sessions require restart for this change.
- Adapted the last-prompt design into a widget beside the live editor, restoring the latest user text from session history and updating on input/message completion. This works in regular mode. It is not a screen-pinned overlay during native terminal scrollback; the terminal owns that viewport.
- Changed selected tool grouping to compact activity summaries, including edit/write tools and single calls. Details remain expandable. Assistant commentary remains visible while calm suppresses thinking, so groups stay separated by commentary.
- Assistant replies now use unfilled text with a muted side accent. User/extension cards use different cyan/purple borders, background only inside, and explicit unfilled message breaks. Cursor shares the lower end-cap row; long-input overflow indication is retained.
- Added `fm_image` and `/harness-image <local path>` using Pi's native inline Image component with bounded thumbnail dimensions. Supports PNG/JPEG/GIF/WebP up to 10 MiB; stores a presentation-only session entry, not model image context. Native capability fallback applies.
- Validated global regular-mode startup, collapsed/expanded fixtures, input return, and local image-entry execution in the dedicated Pi + Herdr session. The text capture cannot verify image pixels. Nineteen functional tests pass. Mac image fidelity, native scrollback, and multiline input still need visual acceptance.
- Source reuse is behavioral/design reuse of the documented sticky prompt and compact display concepts; the fullscreen sticky implementation is not installed. Existing pi-cc grouping remains the selected-source foundation.

Follow-up on 2026-09-06: user correctly identified remaining cursor placement, background outside borders, missing message breaks and indistinct border colors. Catalog research completed before further redesign; see `docs/reviews/output-package-research.md`. Found `pi-sticky-last-prompt` for a terminal sticky prompt and `pi-compact-display` for expandable turn summaries. No packages installed or renderer changes made during that research pass. Prior border checks did not establish a complete visual match.

- Joined the input's top-right corner and added matching side borders and short bottom end caps, replacing Pi's unrelated full-width bottom rule. The native editor still owns text wrapping, cursor markers, completion and scrolling; mouse coordinates account for the added left edge.
- Continued existing panel fill through border cells to remove black gutters around message content. Section headings now sit inside the panel instead of interrupting its top border; the left accent continues through both corners.
- Reloaded and inspected the actual dedicated Pi + Herdr pane, including the existing conversation and a 48-column fixture. ANSI reconstruction: `.runtime/border-review.png`. No terminal font or window-background configuration was changed in this correction.

## Mouse regression correction (2026-09-06)

The previous always-on SGR adapter broke normal terminal interaction: it consumed wheel/non-left events, outside-header clicks, and dialog mouse input. The earlier injected-header test was insufficient to validate native mouse behavior.

Regular mode now starts with reporting disabled and does not consume any input. `/harness-mouse` explicitly enables temporary tool-click capture. Escape, the first wheel report, terminal stop, extension disposal, or input to a capturing dialog releases capture. Subsequent wheel ticks scroll normally; the first tick used to exit capture is not replayed. The click hint appears only while capture is enabled; otherwise the truthful Ctrl+O hint is shown. No fullscreen requirement. The top prompt overlay is retained.

Validation: all 23 tests passed, including four mouse regression cases for default pass-through, matching/batched clicks, wheel/Escape/dialog release, and lifecycle cleanup. Fresh global Pi in dedicated Herdr workspace w4 loaded successfully. Injected press/release at the measured header row expanded the fixture; an injected wheel report returned the hint to Ctrl+O. Inspected `.runtime/mouse-regression.png`, reconstructed from that live ANSI viewport. These checks verify protocol handling and the rendered UI, not physical mouse selection/clipboard behavior or macOS rendering. Existing sessions need `/reload` or a restart to clear the old capture modes.

## Restore transcript cards; remove fixed prompt overlay (2026-09-06)

User screenshot showed the overlay baked into native scrollback, interrupting reply text. Removed the overlay entirely; prompts remain cyan conversation cards. Restored filled, fully bordered assistant cards (pink), while extension cards stay purple. Unfilled breaks separate cards. No new mouse capture changes.

Verified in fresh ordinary global Pi + Herdr workspace w5 with `/harness-cards-check`: inspected `.runtime/cards-restored.png`, reconstructed from live ANSI, showing all three colored boxes. Added 45 rows using the interaction fixture and asserted no LAST USER PROMPT remained in the live viewport. The prompt now scrolls with content; floating/sticky behavior is intentionally unsupported in normal terminal scrollback. Restart Pi to replace the previously patched renderer; `/reload` alone cannot replace its old prototype closure. Old terminal scrollback may retain previously drawn artifacts.

## Reference mismatch acknowledged (2026-09-06)

The supplied reference has a strong left accent and faint rounded outline, not equally bright colored rectangular borders. Updated panel renderer to use a left rail and subdued remaining edges. This is a terminal-cell approximation, not visual parity with the browser. A local ANSI preview exposed cap background leaking outside the thin outline; removed that cap fill after inspection. Final cap adjustment is not yet rechecked in live Herdr.

Outstanding accepted requirements remain: scroll-aware sticky prompt in regular mode and default click-to-expand without breaking mouse behavior. The previous fallback to transcript-only prompts and opt-in `/harness-mouse` does not complete these requirements. Click is currently available only after `/harness-mouse`; Ctrl+O remains the default.

Inspected installed Herdr 0.8.2 schema: includes pane.scroll_changed, pane.graphics.info/set/clear and viewport placement. Official socket API documents experimental viewport graphics, which may allow a host-owned overlay rather than corrupting PTY scrollback. Not yet proven compatible with this host or Mac. Capability probe could not connect to the dedicated review socket; no host graphics changes made. Do not mark sticky/click acceptance complete or claim impossible solely from the failed Pi overlay approach.
