# 벼 육종 도구 Windows 빌드 스크립트
# 실행 방법: PowerShell에서 .\build-windows.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "========================================"
Write-Host "  벼 육종 도구 Windows 빌드 스크립트" -ForegroundColor Cyan
Write-Host "========================================"
Write-Host ""

# Python 확인
try {
    $pythonVersion = python --version 2>&1
    Write-Host "[OK] Python 발견: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "[오류] Python이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "https://www.python.org/downloads/ 에서 Python을 설치해주세요."
    exit 1
}

# PyInstaller 설치
Write-Host ""
Write-Host "[1/4] PyInstaller 설치 중..." -ForegroundColor Yellow
pip install pyinstaller --quiet

# 작업 디렉토리 설정
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
Set-Location $scriptDir

# launcher.py 내용
$launcherCode = @'
import http.server
import socketserver
import webbrowser
import os
import sys
import socket

def get_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

def get_app_path():
    if getattr(sys, 'frozen', False):
        return os.path.dirname(sys.executable)
    else:
        return os.path.dirname(os.path.abspath(__file__))

def main():
    app_path = get_app_path()
    os.chdir(app_path)
    port = get_free_port()
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}/index.html"
        print(f"Server started: {url}")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("Server stopped")

if __name__ == "__main__":
    main()
'@

# 벼육종도구 빌드
Write-Host ""
Write-Host "[2/4] 벼육종도구 빌드 중..." -ForegroundColor Yellow

$breedingDir = "breeding-app-build"
New-Item -ItemType Directory -Force -Path $breedingDir | Out-Null
New-Item -ItemType Directory -Force -Path "dist\벼육종도구" | Out-Null

Copy-Item "$rootDir\index.html" $breedingDir
Copy-Item "$rootDir\rice_breeding_v4_16_prediction.html" $breedingDir
Copy-Item "$rootDir\createphenotypingform.html" $breedingDir
Copy-Item "$rootDir\kasp.html" $breedingDir
Copy-Item "$rootDir\kasp_multi_gene_analyzer.html" $breedingDir
Copy-Item "$rootDir\ssallogo.png" $breedingDir
Copy-Item "$rootDir\logo.png" $breedingDir
$launcherCode | Out-File -FilePath "$breedingDir\launcher.py" -Encoding UTF8

Push-Location $breedingDir
pyinstaller --onefile --noconsole --name "벼육종도구" launcher.py 2>&1 | Out-Null
Copy-Item "dist\벼육종도구.exe" "..\dist\벼육종도구\"
Copy-Item "*.html" "..\dist\벼육종도구\"
Copy-Item "*.png" "..\dist\벼육종도구\"
Pop-Location

Write-Host "  -> 벼육종도구.exe 생성 완료" -ForegroundColor Green

# 표현형조사도구 빌드
Write-Host ""
Write-Host "[3/4] 표현형조사도구 빌드 중..." -ForegroundColor Yellow

$phenoDir = "phenotyping-app-build"
New-Item -ItemType Directory -Force -Path $phenoDir | Out-Null
New-Item -ItemType Directory -Force -Path "dist\표현형조사도구" | Out-Null

Copy-Item "$rootDir\createphenotypingform.html" "$phenoDir\index.html"
Copy-Item "$rootDir\ssallogo.png" $phenoDir
Copy-Item "$rootDir\logo.png" $phenoDir
$launcherCode | Out-File -FilePath "$phenoDir\launcher.py" -Encoding UTF8

Push-Location $phenoDir
pyinstaller --onefile --noconsole --name "표현형조사도구" launcher.py 2>&1 | Out-Null
Copy-Item "dist\표현형조사도구.exe" "..\dist\표현형조사도구\"
Copy-Item "*.html" "..\dist\표현형조사도구\"
Copy-Item "*.png" "..\dist\표현형조사도구\"
Pop-Location

Write-Host "  -> 표현형조사도구.exe 생성 완료" -ForegroundColor Green

# 정리
Write-Host ""
Write-Host "[4/4] 정리 중..." -ForegroundColor Yellow
Remove-Item -Recurse -Force $breedingDir -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $phenoDir -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================"
Write-Host "  빌드 완료!" -ForegroundColor Green
Write-Host "========================================"
Write-Host ""
Write-Host "결과물 위치:"
Write-Host "  - dist\벼육종도구\벼육종도구.exe" -ForegroundColor Cyan
Write-Host "  - dist\표현형조사도구\표현형조사도구.exe" -ForegroundColor Cyan
Write-Host ""
