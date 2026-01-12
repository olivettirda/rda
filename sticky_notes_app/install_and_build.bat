@echo off
chcp 65001 > nul
echo ========================================
echo    스티키 노트 앱 빌드 스크립트
echo ========================================
echo.

REM Node.js 확인
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [오류] Node.js가 설치되어 있지 않습니다.
    echo https://nodejs.org 에서 LTS 버전을 설치해주세요.
    pause
    exit /b 1
)

echo [1/4] Node.js 버전 확인...
node --version
npm --version
echo.

echo [2/4] 의존성 설치 중... (2-5분 소요)
call npm install
if %errorlevel% neq 0 (
    echo [오류] npm install 실패
    pause
    exit /b 1
)
echo.

echo [3/4] 테스트 실행하시겠습니까? (Y/N)
set /p test_choice=선택:
if /i "%test_choice%"=="Y" (
    echo 앱을 테스트합니다. 창을 닫으면 빌드로 진행됩니다.
    call npm start
)
echo.

echo [4/4] Windows 설치파일 빌드 중... (5-10분 소요)
call npm run build:win
if %errorlevel% neq 0 (
    echo [오류] 빌드 실패
    pause
    exit /b 1
)

echo.
echo ========================================
echo    빌드 완료!
echo ========================================
echo.
echo 설치파일: 스티키 노트 Setup 1.0.0.exe (현재 폴더)
echo.
pause
