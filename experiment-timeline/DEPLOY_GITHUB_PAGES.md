# GitHub Pages 배포 가이드

이 문서는 Experiment Timeline Manager를 GitHub Pages에 무료로 배포하는 방법을 설명합니다.

## 배포 방법

### 1️⃣ GitHub 저장소 설정

1. GitHub에서 `olivettirda/rda` 저장소로 이동
2. **Settings** → **Pages** 클릭
3. **Source** 섹션에서:
   - **Source**: `GitHub Actions` 선택

### 2️⃣ 코드 푸시

```bash
cd C:\Users\user\Desktop\experiment-timeline
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

### 3️⃣ 자동 배포 확인

1. GitHub 저장소 → **Actions** 탭 이동
2. "Deploy to GitHub Pages" 워크플로우 실행 확인
3. 초록색 체크 마크(✓)가 뜨면 배포 완료!

### 4️⃣ 접속

배포 완료 후 다음 URL로 접속:

**https://olivettirda.github.io/rda/**

PC와 모바일 모두에서 접속 가능합니다!

## 자동 배포

`main` 브랜치에 푸시할 때마다 자동으로 재배포됩니다:

```bash
git add .
git commit -m "Update features"
git push origin main
```

→ 약 1-2분 후 자동 배포!

## 모바일 접속

1. 모바일 브라우저에서 URL 접속
2. **홈 화면에 추가**:
   - iOS: Safari → 공유 → 홈 화면에 추가
   - Android: Chrome → 메뉴 → 홈 화면에 추가

## 문제 해결

### 404 에러가 나는 경우:
- GitHub Pages 설정에서 Source가 `GitHub Actions`로 설정되었는지 확인

### 빌드 실패 시:
1. GitHub → Actions 탭에서 에러 로그 확인
2. 로컬에서 `npm run build` 테스트

### CSS/JS 파일이 안 보이는 경우:
- `vite.config.js`의 `base: '/rda/'` 경로가 올바른지 확인

## 비용

완전 무료입니다!

## 다음 단계

1. URL 확인: https://olivettirda.github.io/rda/
2. 모바일에서 접속 테스트
3. 홈 화면에 추가
4. 동료들과 URL 공유
