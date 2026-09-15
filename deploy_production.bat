@echo off
setlocal
echo ======================================================================
echo   City-Wide AI ANPR Trajectory Tracking Engine (Production Deployment)
echo   SIH Problem Statement 26127
echo ======================================================================
echo.
cd /d "%~dp0"

echo [Step 1/2] Verifying and Building Optimized Frontend Production Assets...
cd frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed. Aborting deployment.
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo [Step 2/2] Launching Unified Production Server on Port 8000...
echo Both React Dashboard and FastAPI API/WebSockets will be served together!
echo.
python launch_production.py

pause
