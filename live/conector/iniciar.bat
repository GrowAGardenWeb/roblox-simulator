@echo off
cd /d "%~dp0"
if "%~1"=="" (
  set /p TTUSER=Tu usuario de TikTok: 
) else (
  set TTUSER=%~1
)
if not exist node_modules (
  echo Instalando el conector la primera vez...
  call npm install --omit=dev
)
node conector.mjs %TTUSER% %2
pause
