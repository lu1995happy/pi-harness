# Output package research — 2026-09-06

User requested catalog research before another output redesign. No packages installed and no renderer changed in this research pass.

## Candidates

- [pi-sticky-last-prompt](https://pi.dev/packages/pi-sticky-last-prompt): pins the latest user message scrolled fully out of view to the top of fullscreen Pi; click jumps back. Directly relevant to a terminal sticky Last User Prompt. Published documentation supports the behavior; compatibility with our renderer patches is not yet tested.
- [pi-compact-display](https://pi.dev/packages/pi-compact-display): one aggregation header per user turn with configurable tool inclusion and expandable full details via Ctrl+O. Closest inspected starting point for compact activity summaries. It groups across assistant messages in a turn; reproducing the Codex screenshot's separate activity groups between commentary messages requires adaptation.
- [pi-collapse-tools](https://pi.dev/packages/pi-collapse-tools): hides tool results until expanded, but retains individual call headers. Does not supply the full grouped timeline.
- [pi-sticky-prompt](https://pi.dev/packages/pi-sticky-prompt): a separate native macOS input HUD, not a sticky last-message bar inside the terminal. Not the requested surface.

A terminal implementation of plain Markdown commentary separated by collapsible activity summaries is feasible based on these capabilities and the existing local grouped-tool renderer. Exact browser typography, pixel-level rounded cards and overlay compositing are not implied by that assessment. No exact Codex desktop replica was found in this targeted search.

## Corrections required in the next implementation

- Put the editor cursor on the lower border's row, as in the original reference, rather than inside the framed input region.
- Keep background fill inside message borders. Current edge() explicitly paints background on border cells, producing the outer rectangular band in the screenshot.
- Insert an unfilled break between every message, including prompt-to-assistant transitions.
- Give user, assistant and extension messages distinct, consistent border colors. Current user/assistant styling shares cyan accents and the same outer edge color.
- Prefer selected-source adaptation of the sticky prompt and aggregation behaviors, following the user's ownership policy. Preserve main/crew roles, calm semantics, model context and mouse/keyboard routing.
