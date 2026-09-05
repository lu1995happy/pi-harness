# macOS installation and verification

macOS is the primary target for the entire harness. The Windows development host cannot verify macOS clipboard access, native binaries, WezTerm mouse behavior, or Herdr document overlays. Those checks remain pending until a Mac is available.

## Herdr Annotate

With Node, Herdr 0.8.0 or newer, Bun, and Bash on PATH, run from this harness folder:

```sh
node scripts/install-annotate-macos.mjs
herdr server reload-config
```

The installer selects the full upstream plugin at commit `bccf884b874f5f39ccbef1bb6ac67625c5fb5d54`. Its macOS build downloads the native Plannotator TUI. The plugin's fetch script controls that binary version; pinning the plugin commit does not independently verify the downloaded binary. The installer preserves existing action bindings, refuses occupied default keys, backs up configuration before editing, and restores it if Herdr rejects it. The installed plugin remains installed if configuration validation fails; rollback covers configuration only. It honors `HERDR_CONFIG_PATH` (confirmed by Herdr's CLI help); otherwise it uses `~/.config/herdr/config.toml`, as documented by [Herdr](https://herdr.dev/docs/configuration/).

| Binding | Action |
| --- | --- |
| Prefix + a | Annotate terminal selection |
| Prefix + Shift + a | Copy annotation context |
| Prefix + m | Manage annotations |
| Prefix + o | Review documents in the focused pane's folder |
| Prefix + Shift + o | Review the agent's last reply |

The full plugin also registers Ctrl-click handling for Markdown `file://` links. These are the [upstream full-plugin actions](https://github.com/plannotator/herdr-annotate); they must be tested in the macOS application, including feedback arriving at the intended agent.

## Runtime acceptance checks

Run `node scripts/doctor-macos.mjs` on the Mac first. It checks the required CLIs, Chrome's usual app location, and installed dependency platform metadata. It does not prove that a native extension loads or that interactive behavior works.

- Launch Pi inside Herdr from an existing repository, including a subdirectory and a path containing spaces or apostrophes.
- Run Pi, Claude Code, and Codex crews; confirm completion and question commands work in macOS's shell.
- Confirm each map gets one workspace and its first worker uses the default tab.
- Test both Apple Silicon and Intel native dependencies where those platforms are supported. Never copy node_modules from Windows; install from the lockfile on the Mac.
- Check question overlays, Lavish responses, crew todos, grouped command expansion, calm, footer and final-output cards in WezTerm.
- Check Chrome DevTools access to a local UI, FFF's native search, Ponytail guidance and Simplify behavior.
- Exercise all five annotation bindings, Markdown link review, and feedback delivery to each supported crew type.
- Keep macOS evidence separate from Windows smoke-test results in PROGRESS.md.

The global installer is `node scripts/install-macos.mjs`. For the complete runnable handoff, follow [macos-checklist.md](macos-checklist.md); automated evidence is collected by `node scripts/macos-validate.mjs --session pi-harness-mac-check`. The user will execute the macOS checks locally. No completed macOS installation is claimed here.
