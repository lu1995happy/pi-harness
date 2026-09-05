# Pi harness requirements

Status: Implementation in progress; see PROGRESS.md for completed checks and remaining work.

macOS is the primary installation and runtime target for every package and extension. Windows-host checks are supplementary and do not establish macOS compatibility. Herdr Annotate must include macOS document review, last-message review, and Markdown link handling alongside capture, copy-context, and management.

Related documents: [UI and extensions](ui-and-extensions.md) and [upstream maintenance guidance](upstream-maintenance.md).

This document records the user's requirements. Reference projects provide ideas, not additional requirements. Open decisions below do not block this initial capture.

## Purpose and scope

Build a personal, globally available harness inspired by Firstmate: the user talks to a main agent, that agent delegates substantive work to a crew, and background supervision watches the crew and wakes the main agent only when needed.

Adapt the relevant Firstmate concepts selectively. Do not clone or install the full Firstmate distribution into the local harness merely to inherit its behavior; it contains files and integrations the user does not want.

Supported agents are limited to:

- Pi.
- Claude Code.
- Codex.

Pi runs Firstmate and the background supervision session. Crew workers can use Pi, Claude Code, or Codex. Herdr provides the workspace and worker-session experience.

The user reports WezTerm, Pi, and Herdr are already installed locally. Their versions and runtime compatibility have not been checked. Herdr is the requested workspace and worker-session backend. Worktree management must use Git directly, without Treehouse.

## Global availability and project ownership

- Provide the same harness experience when launching Pi + Herdr from any project directory.
- Do not require launching the agent from the harness's own repository or a special Firstmate home directory.
- Work against the user's existing project repository in its existing location.
- Do not require copying or cloning projects into a harness-owned `projects/` directory.
- Worker isolation uses native Git worktrees belonging to that existing repository. These worktrees are consistent with the requirement to work on the existing project; they are not separate project imports.
- Install the custom harness under global Pi configuration, with borrowed Firstmate scripts organized in their own folder for debugging and maintenance. Exact directory names, per-project state, and worktree storage locations remain design decisions.
- Apply the selective-reuse policy to every referenced package: borrow only the needed pieces into owned global folders, unless the full package is needed or extraction is extremely difficult. See the upstream maintenance guidance for provenance and updates.

## Roles

### Main agent: Firstmate

The main agent is the user's point of contact and the coordinator of map execution. It must delegate substantive implementation, investigation, debugging, and review to workers instead of doing that work itself.

Its responsibilities include accepting a map, dispatching issue workers, responding to actionable supervision events, launching a separate reviewer after implementation, coordinating integration, and cleaning up completed issue resources. Git lifecycle operations and orchestration do not constitute the substantive work prohibited above.

### Background supervision

Use the multi-session supervision architecture described in the supplied Firstmate post and diagram. One logical coordinating agent has two sessions running in parallel:

- The main session is the conversation with the user and remains available for interaction while background loops run.
- The supervision session handles background loop and fleet events, makes routine judgments, and decides whether an event warrants waking the main session. It can use a cheaper model independently of the main session.

This requires a background reasoning session as well as any event-watching machinery. The main session must not spend its turns repeatedly evaluating routine events from every worker or loop.

#### Context sharing and wake behavior

- Routine supervision outcomes merge silently into the main session's context without triggering a main-session turn. They become available when the main session next takes a turn; they must not be silently dropped.
- Events requiring human attention wake the main session immediately.
- Main-session user and agent messages merge into the supervision session so its decisions reflect current user intent and conversational context. Main-session tool calls are excluded from this synchronization.
- Preserve prompt caching in both sessions during context merges. The exact mechanism and verification must follow investigation of the existing Pi implementation.
- Session branches and merges are a conversation-context concept, distinct from the map and issue Git branches used for code isolation.

Worker completion must still reach the main agent so it can launch a separate review worker. The workflow must support actionable orchestration wakes as needed to advance the map, without treating every routine event as a user interruption. Exact event classification and dispatch handoff remain to be designed.

#### Reuse in Pi + Herdr

The user identifies this architecture as already supported in Firstmate. Inspect and selectively adapt its existing Pi supervision implementation and necessary dependencies, rather than independently rebuilding the mechanism or importing the full distribution. Preserve the two-session behavior when running the global harness with Pi + Herdr.

Herdr continues to organize map workspaces and crew tabs; a separate visible Herdr tab for the supervision session is not implied by the two-session architecture. Session placement and UI remain open.

The supplied post and diagram use PR and CI babysitting as examples. They explain event routing and context sharing; they do not introduce per-issue PRs, automatic test reruns, or a new merge policy into this harness's map workflow. The implementation details and compatibility of the upstream mechanism have not yet been audited.

### Crew workers

Implementation workers handle assigned issues in isolated issue branches and worktrees. They report completion to the main agent instead of opening a PR for each issue.

After an implementation worker finishes, the main agent launches another worker to review its work. Review is a separate assignment, not an implementation worker's self-approval. The review worker's checkout arrangement and the revision loop will be specified later.

## Maps and planning

A map is the unit of coordinated work and final delivery. It groups related issues that the main agent assigns to workers.

GitHub Issues is the initial example tracker. The user's installed `gh` does not support sub-issues, so map membership and relationships must work without GitHub sub-issue commands. The concrete representation of a map—such as an index issue, labels, or an explicit issue list—is not yet selected.

The intended planning tools are Matt Pocock's `/grill-with-docs`, `/wayfinder`, `/to-spec`, and `/to-tickets`. They are references for the future planning workflow, not skills being installed or executed as part of this requirements capture.

Preserve the distinction between planning decisions and implementation work. The Wayfinder guide describes `/wayfinder` as a map of decision tickets; after decisions are settled, `/to-spec` and `/to-tickets` prepare the build work. For this harness, the delivery map must retain the relationship between its planning material and the implementation issues assigned to crews. Do not assume every Wayfinder decision ticket is a coding task, or that all four skills must run for every map.

## Git lifecycle

1. Accept a map and identify the existing project repository and its base branch, `main` or `master`.
2. Create a map branch from that base branch.
3. For each issue assigned to an implementation worker, create a new issue branch from the map branch and a native Git worktree for that issue branch.
4. Launch the worker in its issue worktree and have it complete the assigned work.
5. Receive the worker's completion report. Do not create a per-issue PR.
6. Launch a separate review worker for the issue changes.
7. Integrate the completed, reviewed issue changes into the map branch. Failed review is not completion; the exact repair and re-review procedure is pending.
8. After successful review and integration, the main agent cleans up the issue branch and worktree and removes the completed worker from Herdr.
9. Once all implementation issues in the map are complete and integrated, delegate a final review of the whole map using `no-mistakes`.
10. Once final review is green, integrate and push the complete map to `main` or `master` as one delivery unit.

The requested outcome is whole-map delivery to the default branch. The exact merge strategy, final approval policy, and handling of branch protection have not yet been selected. Do not infer a map-level PR requirement from the upstream projects.

Conceptual branch relationship:

```text
main or master
  └── map branch
        ├── issue A branch + worktree → separate review → merge into map → cleanup
        ├── issue B branch + worktree → separate review → merge into map → cleanup
        └── issue C branch + worktree → separate review → merge into map → cleanup

completed map → final no-mistakes review → integrate and push to main or master
```

Each issue branch starts from the map branch as it exists when the issue is dispatched. Dependency scheduling, updates to already-running issue branches, integration checks, and conflict resolution remain part of the detailed workflow design.

## Herdr organization

- Create one new Herdr workspace for each map.
- Place workers in tabs inside that map's workspace.
- Use the default tab created with a new workspace; do not leave it unused while creating all worker tabs separately.
- Remove completed issue workers from Herdr as part of cleanup after their work is reviewed and merged.
- The placement of the main agent and supervisor, allocation of the initial tab, reviewer tabs, and retention or deletion of completed map workspaces will be specified with the UI and workflow.

## Initial acceptance criteria

- Launching Pi + Herdr from an existing project can access the global harness without copying the project or changing into the harness repository.
- The supported agent set is Pi, Claude Code, and Codex; unrelated Firstmate integrations are not brought in wholesale.
- The main agent coordinates while workers perform substantive work and separate workers review it.
- Main and supervision sessions can run in parallel, keeping the main session responsive while supervision processes fleet and loop events.
- Routine supervision outcomes enter main-session context without starting a main-session turn and are available on its next turn.
- Events requiring human attention wake the main session immediately; orchestration events also reach the coordinator as needed to advance work.
- Main-session user and agent messages, excluding tool calls, synchronize into supervision context.
- Supervision can use a separate, cheaper model, and context synchronization preserves prompt caching in both sessions.
- The global Pi + Herdr integration selectively adapts Firstmate's existing Pi supervision mechanism.
- A map can group and execute issues without `gh` sub-issue support.
- Every map has its own branch and Herdr workspace, with the workspace's default tab used.
- Every implementation issue gets a branch from the map branch and a native Git worktree.
- Issue completion leads to separate review and integration into the map branch, without a per-issue PR.
- Successful issue integration is followed by issue branch, worktree, and Herdr worker cleanup.
- A completed map receives a final `no-mistakes` review before delivery to `main` or `master`.

## Decisions to settle in later requirements

These are open design points, not additional requirements or requests for immediate answers.

- Worker selection: Pi coordinates and supervises; how are Pi, Claude Code, and Codex selected for individual crew assignments?
- Map representation: Where do membership, dependencies, planning decisions, and progress live without sub-issues? Is GitHub required or merely the first tracker example?
- Supervision: Which events require an orchestration wake versus human attention, how does wake delivery work during an active main turn, and how does execution recover after interrupted sessions? Which upstream Pi components provide context merging and cache preservation, and what adaptation is needed for global Pi + Herdr use?
- Scheduling and review: What is the concurrency policy, how are dependencies respected, where do reviewers run, and who handles revisions and merge conflicts?
- Final delivery: What defines a green `no-mistakes` review, how is it adapted to a local map branch, and is final integration/push automatic or user-triggered?
- Local lifecycle: Where are global state and worktrees stored, how is the user's active checkout handled, when are GitHub issues closed, and what remains after map completion?
- UI and extensions: The choices are captured in [UI and extensions](ui-and-extensions.md). Output is adapted into Pi's terminal; calm affects only the middle thinking/building section, preserving the user's prompt and final response. Detailed layout and extension integration remain implementation work.

## References and verification notes

Tab cleanup clarification: do not create a retained map/holder tab. If more map work remains and cleanup would close the last tab, leave the completed crew tab and its worktree until a real successor worker or final-review tab exists, then finish cleanup. A completed map may close its last tab.

- [Firstmate](https://github.com/kunchenguid/firstmate): architectural inspiration for a main agent, delegated crew, isolated work, and background supervision. Its full distribution and defaults are not adopted by this document.
- [Firstmate supervision demonstration](https://x.com/kunchenguid/status/2091988752847823133): initial retrieval returned HTTP 403. The user subsequently supplied the post text and its "Multi-brain agent architecture" diagram, which establish the two-session requirements above. The supplied material resolves the missing behavioral reference; upstream implementation verification remains pending.
- [Matt Pocock's Wayfinder guide](https://www.aihero.dev/skills-wayfinder): source for the distinction between decision maps and the subsequent specification and implementation-ticket stages.
- [no-mistakes](https://github.com/kunchenguid/no-mistakes): requested final map review skill. Exact integration and success criteria remain to be designed.

This document captures requirements only. It does not install upstream skills, alter global agent configuration, create GitHub issues, launch crews, or implement the harness.
