@echo off
echo ========================================================
echo   Islam View Caption Studio - Windows Starter
echo ========================================================
echo.

where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [!] FFmpeg is not found in your PATH.
    echo [*] Please install FFmpeg using: winget install Gyan.FFmpeg
    echo.
) else (
    echo [v] FFmpeg is detected successfully.
)

echo [*] Installing dependencies...
call npm install

echo.
echo [*] Starting Islam View Caption Studio...
echo [*] Open your browser at: http://localhost:3000
echo.
call npm run dev
pause
