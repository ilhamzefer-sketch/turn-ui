@echo off
setlocal

set "API_SCRIPT=C:\Users\User\Desktop\turn-api\scripts\run-api-dev.ps1"
set "UI_SCRIPT=C:\Users\User\Desktop\turn-ui\scripts\run-ui-dev.ps1"
set "EPOINT_SCRIPT=C:\Users\User\Desktop\turn-api\scripts\run-epoint-sandbox.ps1"

start "epoint-sandbox" powershell -NoExit -ExecutionPolicy Bypass -File "%EPOINT_SCRIPT%"
start "turn-api" powershell -NoExit -ExecutionPolicy Bypass -File "%API_SCRIPT%"
start "turn-ui" powershell -NoExit -ExecutionPolicy Bypass -File "%UI_SCRIPT%"

echo epoint-sandbox, turn-api and turn-ui are starting in separate terminal windows.
echo Epoint sandbox: http://127.0.0.1:8181
echo UI:  http://127.0.0.1:5275
echo API: http://127.0.0.1:8080
endlocal
