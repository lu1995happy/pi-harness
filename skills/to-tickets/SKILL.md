---
name: to-tickets
description: Turn a specification into independently verifiable vertical-slice issues and an explicit dependency map for Firstmate crews.
---

Adapted from Matt Pocock's tracer-bullet ticket workflow. Read the spec, decisions and existing codebase evidence. Have a crew draft narrow end-to-end slices, each deliverable in one fresh context. Include title, problem, acceptance criteria, test expectations, out-of-scope boundaries and blocking issue IDs. For a wide mechanical refactor use expand, migrate in bounded batches, then contract.

Keep dependencies acyclic and only include real prerequisites. Present the breakdown when it needs a user decision; do not add another approval round when the user has already authorized execution and no unresolved decision changes scope.

Use ordinary GitHub issues linked from one index issue, or local Markdown until publication is authorized. No PR per ticket and no sub-issue API. Export a map spec:

```json
{"mapId":"feature-name","repo":"/absolute/existing/repository","title":"Feature name","issues":[{"id":"issue-42","title":"Deliver one slice","body":"Full issue context and URL","acceptance":["Observable outcome"],"dependsOn":[]}]}
```

Firstmate creates the map with `fm_map`, dispatches dependency-ready issues, requests separate reviews, merges reviewed work and cleans up. After every issue is merged, a separate reviewer runs the final no-mistakes gate before Firstmate ships the exact reviewed map commit.
