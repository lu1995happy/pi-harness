---
name: no-mistakes
description: Drive the independent final map validation through the local no-mistakes gate before Firstmate publishes the reviewed map.
---

# Final map gate

Read [the upstream driving guide](upstream.md) for gate decisions and branch synchronization. This harness adapts its publication boundary: Firstmate owns publication after validation. Run the pipeline with `--skip push,pr,ci`; do not open a PR or publish through no-mistakes. All local validation phases remain required. Report local validation separately from remote CI evidence.

Firstmate delegates this work to the assigned final reviewer. The reviewer inspects the whole map, reads its requirements and issue acceptance criteria, and drives no-mistakes from the map worktree. If needed, initialize this repository with `no-mistakes init`; preserve existing gate configuration. Use Pi as the configured pipeline agent when no backend has been configured.

Start with `no-mistakes doctor` and `no-mistakes axi`. Run `no-mistakes axi run --intent "<complete map goal and decisions>" --skip push,pr,ci`. Wait for each invocation to return; a running validation can take minutes. Inspect progress with `axi status` rather than launching duplicates.

At gates, let the pipeline implement fixes through `axi respond`; do not edit code concurrently. Send findings requiring a user decision to Firstmate using `fm_gate_question`, retaining their IDs and full descriptions. Wait for its answer. Do not use `--yes` or skip local checks merely to make the gate green.

Follow `branch_sync` guidance to synchronize pipeline fixes into the existing map branch without dropping commits. Run `fm_review` with the current map HEAD and your verdict. For a passing final review, the harness independently queries `no-mistakes axi status` and checks its run, HEAD and local steps; a prose claim of passing is insufficient. If the gate is unavailable or cannot prove this HEAD, report the blocker rather than a pass.

The upstream guide's push, PR and CI flow is reference material; the explicit map publication boundary above replaces it.
