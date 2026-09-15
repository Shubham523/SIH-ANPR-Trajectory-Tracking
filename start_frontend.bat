@echo off
echo ================================================================
echo  Starting Utilitarian Frontend Dashboard (React + Vite)
echo  SIH Problem Statement 26127 - Port 5173
echo ================================================================
cd /d "%~dp0frontend"
npm run dev -- --host
pause
