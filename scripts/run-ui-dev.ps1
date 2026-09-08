$ErrorActionPreference = "Stop"

$UiRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $UiRoot

$PortInUse = Get-NetTCPConnection -LocalPort 5275 -State Listen -ErrorAction SilentlyContinue
if ($PortInUse) {
  Write-Host "turn-ui is already running on http://127.0.0.1:5275"
  Write-Host "Close the old turn-ui terminal first if you want to restart it."
  return
}

Write-Host "Starting turn-ui..."
npm run dev
