-- Merge this module into your existing WezTerm config before `return config`.
-- Install a Nerd Font first; no extension can change the terminal's font.
local wezterm = require 'wezterm'
return function(config)
  config.font = wezterm.font_with_fallback { 'JetBrainsMono Nerd Font', 'Menlo' }
  config.font_size = 13
  config.colors = config.colors or {}
  config.colors.background = '#18181e'
  config.colors.foreground = '#d9dfed'
  config.colors.cursor_bg = '#d9dfed'
  config.colors.selection_bg = '#3a3e59'
  config.set_environment_variables = config.set_environment_variables or {}
  config.set_environment_variables.POWERLINE_NERD_FONTS = '1'
  return config
end
