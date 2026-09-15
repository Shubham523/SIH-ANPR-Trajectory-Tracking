@echo off
echo ================================================================
echo  Launching City-Wide AI Engine (MVP) - SIH Problem Statement 26127
echo ================================================================
echo.
echo [1/2] Launching Central FastAPI Backend on http://localhost:8000 ...
start "SIH AI Engine - Backend" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo [2/2] Launching React Dashboard on http://localhost:5173 ...
start "SIH AI Engine - Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ================================================================
echo  System is spinning up!
echo  - Backend Docs: http://localhost:8000/docs
echo  - Live Frontend: http://localhost:5173
echo ================================================================
pause
