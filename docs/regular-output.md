# Regular terminal output

Restart Pi after updating. Global activation and the macOS installer now select `regular` mode; native terminal history remains available. An explicit `--tui-mode fullscreen` still overrides the global setting, so omit it.

User prompts are cyan transcript cards before their replies. The fixed overlay has been removed: normal terminal scrollback can retain overlay text inside older replies. A browser-style sticky prompt is not supported by this regular-mode implementation.

Replies are boxed Markdown with pink borders. Prompt and extension cards use cyan and purple borders. All cards have interior-only fill and unfilled message breaks. Activity groups summarize calls such as “Ran commands” and “Edited files”; Ctrl+O expands/collapses by default. `/harness-mouse` explicitly enables temporary header clicks using the completed render's component layout and viewport offset. The hint follows the active mode. Calm hides thinking but retains assistant commentary between activity groups.

Native mouse behavior is the default; no bypass modifier is needed. Temporary capture ends on Escape, the first wheel report, dialog input, terminal stop, or extension shutdown. The first wheel tick releases capture without scrolling; subsequent ticks scroll natively. Capture is not automatically re-enabled on resume or reload. The adapter targets the installed Pi 0.85 main-screen internals; revalidate it when updating Pi.

## Images

Use `/harness-image /absolute/path/to/image.png`, or let the agent call `fm_image` for a local artifact. The preview is a native Pi Image component bounded to 60 columns by 16 rows, with a file label. Supported formats: PNG, JPEG, GIF, WebP; maximum file size: 10 MiB. Bytes are kept in a presentation-only session entry so the preview can survive reopening; they are not inserted into model context by this tool.

Image pixels require the terminal image protocol to work through Herdr. Unsupported terminals receive Pi's image fallback and the file label. This is an inline thumbnail implementation, not a browser lightbox or a promise of Codex's image interaction controls. The local text capture confirms command execution, not rendered pixel fidelity.

## Mac acceptance

- Start plain `pi` from another project. Confirm native terminal history works.
- Submit a prompt and verify its card precedes its reply and scrolls with the conversation. Exercise native history and selection without a modifier.
- Confirm user/reply/extension breaks stay unfilled, with no surrounding rectangular background bands.
- Type multiline input, scroll within it, and test completion and paste; cursor should share the lower end-cap row for single-line input.
- Expand actual tool groups with Ctrl+O, including a single tool and an edit/write group. Commentary should remain between separate groups.
- Run `/harness-image` on a local PNG in Pi + Herdr + WezTerm. Inspect image pixels, resize, and reopen the session. Check an unsupported terminal's fallback separately.

Design references: [pi-sticky-last-prompt](https://pi.dev/packages/pi-sticky-last-prompt), [pi-compact-display](https://pi.dev/packages/pi-compact-display). Native image API: [Pi TUI components](https://pi.dev/docs/latest/tui).


