---
name: grill-with-docs
description: Resolve a design's open decisions while maintaining domain terms and documented decisions, using Pi question and visual tools.
---

Adapted from Matt Pocock's grilling and domain-modeling workflows. Build a decision tree. Ask only questions whose prerequisites are settled; group independent questions into a round. Give a recommended answer and explain the tradeoff briefly. Firstmate delegates facts that need investigation to crews and continues questions that do not depend on that investigation.

Use `ask_user_question` for simple non-UI decisions. Use the show-me skill with a crew-created Lavish artifact for complex explanations and UI choices. Preserve the user's earlier decisions instead of asking again.

As terms become clear, have a crew maintain the project's domain glossary in CONTEXT.md, or follow an existing CONTEXT-MAP.md. Record consequential decisions in the existing ADR convention; create documents only when there is a concrete decision to record. Test the model with edge cases and distinguish agreed vocabulary from unresolved terminology.

Finish when the decision frontier is empty or remaining questions are explicitly deferred. Hand the settled context to `/to-spec` or `/wayfinder`, following the user's existing authorization for implementation.
