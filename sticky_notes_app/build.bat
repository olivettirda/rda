@echo off
echo ======================================
echo    Sticky Notes App Build
echo ======================================
echo.

echo [1] Cleaning all caches...
rmdir /s /q dist 2>nul
rmdir /s /q node_modules\.cache 2>nul
rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache" 2>nul
rmdir /s /q "%USERPROFILE%\.cache\electron-builder" 2>nul
echo    Cache cleaned.
echo.

echo [2] Installing dependencies...
call npm install
echo.

echo [3] Building Windows app...
call npm run build:win
echo.

echo ======================================
echo    Build Complete!
echo ======================================
echo.
for %%f in (dist\*.exe) do echo Setup file: "%%~nxf"
echo.
pause
