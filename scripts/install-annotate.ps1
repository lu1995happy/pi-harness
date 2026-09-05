$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$bunSource = Join-Path $projectRoot 'node_modules/@oven/bun-windows-x64/bin/bun.exe'
if (-not (Test-Path -LiteralPath $bunSource)) { throw 'Install the pinned project dependencies first.' }
$bunDirectory = Join-Path $env:USERPROFILE '.bun/bin'
New-Item -ItemType Directory -Force -Path $bunDirectory | Out-Null
Copy-Item -LiteralPath $bunSource -Destination (Join-Path $bunDirectory 'bun.exe')
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (($userPath -split ';') -notcontains $bunDirectory) {
    [Environment]::SetEnvironmentVariable('Path', ($userPath.TrimEnd(';') + ';' + $bunDirectory), 'User')
}
$env:PATH = $bunDirectory + ';' + $env:PATH
$herdrExe = 'C:/Users/misak/.herdr/packages/standalone/releases/0.8.2-x86_64-pc-windows-msvc/herdr.exe'
& $herdrExe plugin install plannotator/herdr-annotate --ref bccf884b874f5f39ccbef1bb6ac67625c5fb5d54 --yes
if ($LASTEXITCODE -ne 0) { throw 'Herdr plugin install failed.' }
$configDirectory = Join-Path $env:APPDATA 'herdr'
$configFile = Join-Path $configDirectory 'config.toml'
New-Item -ItemType Directory -Force -Path $configDirectory | Out-Null
$content = if (Test-Path -LiteralPath $configFile) { Get-Content -LiteralPath $configFile -Raw } else { '' }
if (Test-Path -LiteralPath $configFile) {
    Copy-Item -LiteralPath $configFile -Destination ($configFile + '.before-annotate-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
}
$bindings = @(
    @{ key = 'prefix+a'; command = 'annotate.capture'; description = 'annotate text' },
    @{ key = 'prefix+shift+a'; command = 'annotate.copy-context'; description = 'copy annotations as context' },
    @{ key = 'prefix+m'; command = 'annotate.manage'; description = 'manage annotations' }
)
foreach ($binding in $bindings) {
    if ($content.Contains('command = "' + $binding.command + '"')) { continue }
    if ($content.Contains('key = "' + $binding.key + '"')) { throw ('Key already bound: ' + $binding.key + '. Original config remains backed up; choose a free binding.') }
    $content += "`n[[keys.command]]`nkey = `"$($binding.key)`"`ntype = `"plugin_action`"`ncommand = `"$($binding.command)`"`ndescription = `"$($binding.description)`"`n"
}
[IO.File]::WriteAllText($configFile, $content)
& $herdrExe config check
if ($LASTEXITCODE -ne 0) { throw 'Herdr rejected config; inspect the saved backup.' }
& $herdrExe plugin list --plugin annotate --json
Write-Output ('Bun installed at ' + $bunDirectory + '; annotation keys added to ' + $configFile)
