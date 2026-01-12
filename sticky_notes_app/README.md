# 스티키 노트 데스크톱 앱

Windows/Mac/Linux용 데스크톱 앱입니다.

## 기능

- 바탕화면 앱처럼 실행
- 자동 로그인 (한 번 로그인하면 다음부터 자동)
- 시스템 트레이 아이콘 (닫아도 백그라운드 실행)
- Windows 시작 시 자동 실행 옵션

## 빌드 방법

### 1. Node.js 설치

https://nodejs.org 에서 LTS 버전 다운로드 후 설치

### 2. 의존성 설치

```bash
cd sticky_notes_app
npm install
```

### 3. 개발 모드 실행

```bash
npm start
```

### 4. 배포용 빌드

```bash
# Windows용 (.exe)
npm run build:win

# Mac용 (.dmg)
npm run build:mac

# Linux용 (.AppImage)
npm run build:linux
```

빌드된 파일은 `dist/` 폴더에 생성됩니다.

## 사용 방법

1. 앱 실행
2. 아이디/비밀번호 입력 후 로그인
3. 다음 실행부터 자동 로그인됨
4. 창을 닫아도 시스템 트레이에서 실행 중
5. 트레이 아이콘 우클릭 → 종료로 완전 종료

## 폴더 구조

```
sticky_notes_app/
├── package.json      # 프로젝트 설정
├── main.js           # Electron 메인 프로세스
├── preload.js        # 보안 브릿지
├── index.html        # 앱 UI
└── assets/
    └── icon.png      # 앱 아이콘
```
