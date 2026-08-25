@echo off
cd /d "%~dp0.."
node tools\generate-license-key.js
echo.
pause
