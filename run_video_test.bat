@echo off
setlocal
echo ======================================================================
echo   AI Vehicle Classification, ANPR and Re-ID Test Pipeline
echo   Smart India Hackathon (SIH 26127)
echo ======================================================================
echo.
cd /d "%~dp0"

echo [Options]
echo  1. Run with Auto-Generated Traffic Video Clip (Default)
echo  2. Run with Laptop Webcam (Camera 0)
echo  3. Run with Custom Video File
echo.
set /p choice="Enter option (1, 2, or 3, default=1): "

if "%choice%"=="2" (
    echo Launching with Webcam...
    python test_video_pipeline.py --video 0 --camera CAM-WEBCAM-01
) else if "%choice%"=="3" (
    set /p vpath="Enter path to your video file (e.g. traffic.mp4): "
    python test_video_pipeline.py --video "%vpath%" --camera CAM-FILE-01
) else (
    echo Launching with sample traffic video...
    python test_video_pipeline.py --camera CAM-N-01
)

pause
