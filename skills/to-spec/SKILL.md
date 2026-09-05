---
name: to-spec
description: Synthesize the agreed conversation and codebase findings into a specification without restarting the interview.
---

Adapted from Matt Pocock's to-spec. Firstmate delegates codebase inspection and document drafting to a crew, providing the complete agreed intent, constraints and decisions. Preserve the project's glossary and ADRs.

Use sections: Problem Statement, Solution, User Stories, Implementation Decisions, Testing Decisions, Out of Scope, Further Notes. Make stories concrete and cover observable behavior, errors and important edge cases. Prefer stable module responsibilities and interfaces to speculative file paths. Include exact snippets only when they encode a settled design better than prose.

Testing decisions describe observable behavior and existing test seams; avoid tests that only search implementation text. Record unresolved decisions explicitly. Do not restart questioning when the conversation already settles them; route genuinely missing decisions through the selected question UI.

Save a local spec or publish a normal issue in the authorized tracker. Return its path or linked title, then hand off to `/to-tickets` when requested or already authorized.
