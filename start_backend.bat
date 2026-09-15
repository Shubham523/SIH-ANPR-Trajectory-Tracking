@echo off
echo ================================================================
echo  Starting City-Wide AI Engine Backend (FastAPI / Uvicorn)
echo  SIH Problem Statement 26127 - Port 8000
echo ================================================================
cd /d "%~dp0backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
