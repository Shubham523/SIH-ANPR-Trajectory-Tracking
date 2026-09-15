@echo off
setlocal
title City-Wide AI ANPR Engine (SIH 26127)
cd /d "%~dp0"

echo ======================================================================
echo   City-Wide AI Multi-Camera ANPR Trajectory Tracking Engine
echo   Smart India Hackathon (SIH 26127)
echo ======================================================================
echo.

python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python was not found in PATH!
    echo Please install Python 3.10+ and make sure it is added to your PATH.
    pause
    exit /b 1
)

echo Starting Unified Engine (Dashboard + Backend + Simulation) on Port 8000...
echo.
python launch_production.py

pause
