<#
  Spec 016 · T008 — Suite automatizada en un Android físico conectado por USB (PowerShell).
  Uso:
    .\scripts\device-tests.ps1 -Modo apk
    .\scripts\device-tests.ps1 -Modo expo-go -Link exp://192.168.1.20:8081
  Variables opcionales: E2E_EMAIL, E2E_PASSWORD (si faltan se generan para esta corrida),
  E2E_ITEM_TITLE (objeto de staging que pedirá el flujo 03), E2E_API_URL,
  E2E_ALLOW_API_HOST (host:puerto extra; la lista base está en scripts/e2e-allowed-hosts.json).
  Falla con un mensaje claro si no hay teléfono, adb o Maestro, y no escribe resultados.
#>
param(
  [ValidateSet('apk', 'expo-go')] [string] $Modo = 'apk',
  [string] $Link = '',
  [string] $Serial = ''
)

$ErrorActionPreference = 'Stop'
$raiz = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error 'No encuentro Node.js en el PATH (node --version).'
  exit 2
}

$argumentos = @('--modo', $Modo)
if ($Link -ne '') { $argumentos += @('--link', $Link) }
if ($Serial -ne '') { $argumentos += @('--serial', $Serial) }

Push-Location $raiz
try {
  & node (Join-Path $PSScriptRoot 'device-tests.mjs') @argumentos
  exit $LASTEXITCODE
}
finally {
  Pop-Location
}
