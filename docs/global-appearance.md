# Global loading, roles, colors and fonts

## Ordinary Pi launches

For development, run `node scripts/activate-local.mjs` from this repository. It backs up global Pi settings, registers the absolute owned source package, selects `firstmate`, and preserves the provider/model and unrelated packages. Restart existing Pi processes. New `pi` launches do not need `-e` or a particular project folder. Keep this source directory in place while it is globally registered.

For macOS deployment use `node scripts/install-macos.mjs`: it installs an owned versioned release under global Pi configuration, including the theme and terminal configuration module. A prior custom Pi theme is preserved; select `firstmate` in `/settings` to use the harness palette.

`/harness` should identify the main role on an ordinary launch. Worker assignments choose crew/reviewer roles. Only main displays the fleet/status groups. Work sessions get todo; the event-classification supervisor does not. Review tasks do not overwrite implementation task lists.

## Terminal font and background on the Mac

Pi themes control component colors, not terminal fonts or the terminal window background. The referenced powerline package specifies Nerd Font support and fallbacks; its README does not identify one exact screenshot typeface. This configuration chooses JetBrainsMono Nerd Font as a reproducible compatible option, not an asserted identification of that screenshot.

Install the font:

```sh
brew install --cask font-jetbrains-mono-nerd-font
```

Then, in your existing WezTerm configuration **before its `return config`**, load the module from the installed release. Replace the release path with the current release printed by the installer:

```lua
config = dofile('/absolute/path/to/release/config/wezterm-harness.lua')(config)
```

For source development, use this repository's absolute path instead. The module selects the font, sets the dark background and text/selection colors, and enables the selected Nerd Font icons through `POWERLINE_NERD_FONTS=1`. It preserves other WezTerm configuration fields. Open a new terminal tab after applying it. Use `wezterm ls-fonts` to inspect actual resolution. A Pi process running in another terminal still uses that terminal's own font settings.

Sources: [Homebrew font cask](https://formulae.brew.sh/cask/font-jetbrains-mono-nerd-font), [WezTerm font configuration](https://wezterm.org/config/fonts.html), [referenced powerline package](https://github.com/nicobailon/pi-powerline-footer/tree/1e95b918689dc6b87bc98d3341c6da6fd59fb57c).

The global firstmate theme coordinates tool/dialog colors; the output panels remain an owned terminal adaptation of the web UI screenshot. It is not a claim of an exact shared upstream theme across all the independent packages.
