---
name: show-me
description: Explain complex decisions or UI questions with a focused visual artifact in Lavish, collecting the user's response.
---

Use the visual selection guidance in [the upstream skill](upstream.md). The harness's conversation stays in Pi's terminal. Lavish is for the specific visual question, not a second conversation transcript.

Firstmate delegates HTML creation to a crew with the question, known decisions, alternatives and required evidence. Use one focused local HTML artifact with clear labels and enough explanation to choose. Include accessible controls where interaction clarifies the decision. Avoid requiring a build system for a small explanation.

Firstmate opens the returned absolute file path with `fm_visual`, associating it with the map. Its status appears as waiting for the user. Feedback returns through supervision; do not treat page opening or elapsed time as an answer. Route simple non-UI questions through `ask_user_question` instead.
