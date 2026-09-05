---
name: wayfinder
description: Map a large effort into linked decision issues, resolving prerequisites until the route to a specification is clear.
---

Adapted from Matt Pocock's wayfinder. State the destination, constraints and unresolved decisions. This is a planning map: decision tickets resolve questions; implementation tickets come later through `/to-tickets` unless execution was explicitly included.

Use one map/index issue with an explicit linked list of ordinary issues. No native sub-issue features are required. Include titles, URLs, membership, blocking edges and decisions so far. Each decision lives in its own issue; the index records a short gist and link. Refer to issues by linked title in conversation.

Resolve the frontier: tickets whose blocking decisions are settled. Firstmate dispatches research to crews, answers from known decisions, and escalates missing user choices using the question-routing rules. Keep the index and dependency graph current as the frontier changes. Do not invent answers to unblock downstream tickets.

For unpublished planning, keep the same structure in local Markdown. Publish ordinary GitHub issues through `gh issue create/edit` only within the user's authorized repository work; no sub-issue commands. Finish with the decisions and explicit handoff to `/to-spec` or `/to-tickets`.
