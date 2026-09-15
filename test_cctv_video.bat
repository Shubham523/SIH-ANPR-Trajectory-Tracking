 @echo off
setlocal
echo ======================================================================
echo   Testing 4K CCTV Traffic Video (Traffic Control CCTV.mp4)
echo   YOLOv8 Detection + ByteTrack + ANPR + 512-dim Re-ID
echo   Smart India Hackathon (SIH 26127)
echo ======================================================================
echo.
cd /d "%~dp0"

set VIDEO_FILE=C:\Users\ss479\Downloads\Traffic Control CCTV.mp4

if not exist "%VIDEO_FILE%" (
    echo [ERROR] Could not find file at: "%VIDEO_FILE%"
    echo Please verify the file is located in your Downloads folder.
    pause
    exit /b 1
)

echo [Video Detected] 4K UHD Traffic Video (3840x2160)
echo [Camera Node]    Assigned to CAM-N-01 (North Gate Junction)
echo.
echo Launching AI Pipeline...
echo - Press 'SPACE' to pause/resume the video
echo - Press 'q' to stop and view the final tracking report
echo.

python test_video_pipeline.py --video "%VIDEO_FILE%" --camera CAM-N-01

pause
