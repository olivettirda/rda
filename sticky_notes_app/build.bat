@echo off
echo ======================================
echo    Sticky Notes App Build
echo ======================================
echo.
echo [1] Installing dependencies...
call npm install
echo.
echo [2] Building Windows app...
call npm run build:win
echo.
echo ======================================
echo    Build Complete!
echo ======================================
echo.
echo Setup file: "Sticky Notes Setup 1.0.0.exe"
echo.
pause
