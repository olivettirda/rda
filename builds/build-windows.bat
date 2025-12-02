@echo off
chcp 65001 >nul
echo ========================================
echo  벼 육종 도구 Windows 빌드 스크립트
echo ========================================
echo.

REM Python 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] Python이 설치되어 있지 않습니다.
    echo https://www.python.org/downloads/ 에서 Python을 설치해주세요.
    pause
    exit /b 1
)

echo [1/4] PyInstaller 설치 중...
pip install pyinstaller

echo.
echo [2/4] 벼육종도구 빌드 중...
mkdir dist\벼육종도구 2>nul

REM breeding-app 폴더로 복사
mkdir breeding-app 2>nul
copy ..\index.html breeding-app\
copy ..\rice_breeding_v4_16_prediction.html breeding-app\
copy ..\createphenotypingform.html breeding-app\
copy ..\kasp.html breeding-app\
copy ..\kasp_multi_gene_analyzer.html breeding-app\
copy ..\ssallogo.png breeding-app\
copy ..\logo.png breeding-app\

REM launcher.py 생성
echo import http.server > breeding-app\launcher.py
echo import socketserver >> breeding-app\launcher.py
echo import webbrowser >> breeding-app\launcher.py
echo import os >> breeding-app\launcher.py
echo import sys >> breeding-app\launcher.py
echo import socket >> breeding-app\launcher.py
echo. >> breeding-app\launcher.py
echo def get_free_port(): >> breeding-app\launcher.py
echo     with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s: >> breeding-app\launcher.py
echo         s.bind(('', 0)) >> breeding-app\launcher.py
echo         return s.getsockname()[1] >> breeding-app\launcher.py
echo. >> breeding-app\launcher.py
echo def get_app_path(): >> breeding-app\launcher.py
echo     if getattr(sys, 'frozen', False): >> breeding-app\launcher.py
echo         return os.path.dirname(sys.executable) >> breeding-app\launcher.py
echo     else: >> breeding-app\launcher.py
echo         return os.path.dirname(os.path.abspath(__file__)) >> breeding-app\launcher.py
echo. >> breeding-app\launcher.py
echo def main(): >> breeding-app\launcher.py
echo     app_path = get_app_path() >> breeding-app\launcher.py
echo     os.chdir(app_path) >> breeding-app\launcher.py
echo     port = get_free_port() >> breeding-app\launcher.py
echo     handler = http.server.SimpleHTTPRequestHandler >> breeding-app\launcher.py
echo     with socketserver.TCPServer(("", port), handler) as httpd: >> breeding-app\launcher.py
echo         url = f"http://localhost:{port}/index.html" >> breeding-app\launcher.py
echo         print(f"서버 시작: {url}") >> breeding-app\launcher.py
echo         webbrowser.open(url) >> breeding-app\launcher.py
echo         try: >> breeding-app\launcher.py
echo             httpd.serve_forever() >> breeding-app\launcher.py
echo         except KeyboardInterrupt: >> breeding-app\launcher.py
echo             print("종료") >> breeding-app\launcher.py
echo. >> breeding-app\launcher.py
echo if __name__ == "__main__": >> breeding-app\launcher.py
echo     main() >> breeding-app\launcher.py

cd breeding-app
pyinstaller --onefile --noconsole --name "벼육종도구" --icon=ssallogo.png launcher.py
copy dist\벼육종도구.exe ..\dist\벼육종도구\
copy *.html ..\dist\벼육종도구\
copy *.png ..\dist\벼육종도구\
cd ..

echo.
echo [3/4] 표현형조사도구 빌드 중...
mkdir dist\표현형조사도구 2>nul

REM phenotyping-app 폴더 생성
mkdir phenotyping-app 2>nul
copy ..\createphenotypingform.html phenotyping-app\index.html
copy ..\ssallogo.png phenotyping-app\
copy ..\logo.png phenotyping-app\
copy breeding-app\launcher.py phenotyping-app\

cd phenotyping-app
pyinstaller --onefile --noconsole --name "표현형조사도구" --icon=ssallogo.png launcher.py
copy dist\표현형조사도구.exe ..\dist\표현형조사도구\
copy *.html ..\dist\표현형조사도구\
copy *.png ..\dist\표현형조사도구\
cd ..

echo.
echo [4/4] 정리 중...
rmdir /s /q breeding-app 2>nul
rmdir /s /q phenotyping-app 2>nul

echo.
echo ========================================
echo  빌드 완료!
echo ========================================
echo.
echo 결과물 위치:
echo   - dist\벼육종도구\벼육종도구.exe
echo   - dist\표현형조사도구\표현형조사도구.exe
echo.
pause
