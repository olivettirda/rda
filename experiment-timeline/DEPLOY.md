# 배포 가이드 (Vercel)

이 문서는 Experiment Timeline Manager를 Vercel에 무료로 배포하는 방법을 설명합니다.

## 왜 Vercel인가?

- ✅ **완전 무료** (개인 프로젝트)
- ✅ **자동 HTTPS** (보안 연결)
- ✅ **빠른 배포** (GitHub 연동 시 자동 배포)
- ✅ **글로벌 CDN** (전 세계 어디서나 빠른 속도)
- ✅ **모바일/PC 모두 지원**

## 배포 방법

### 1️⃣ Vercel 계정 생성

1. https://vercel.com 접속
2. **Sign Up** → **Continue with GitHub** 선택
3. GitHub 계정으로 로그인

### 2️⃣ 프로젝트 배포

#### 방법 A: GitHub 연동 (추천)

1. Vercel 대시보드에서 **Add New** → **Project** 클릭
2. **Import Git Repository** → `olivettirda/rda` 저장소 선택
3. **Root Directory** 설정:
   - `experiment-timeline` 입력 (중요!)
4. **Framework Preset**: Vite 자동 감지됨
5. **Environment Variables** 추가 (없음 - Supabase 키는 이미 코드에 있음)
6. **Deploy** 클릭

**배포 완료!** 🎉

배포 URL: `https://your-project-name.vercel.app`

#### 방법 B: Vercel CLI (수동)

```bash
# 1. Vercel CLI 설치
npm install -g vercel

# 2. 프로젝트 폴더로 이동
cd C:\Users\user\Desktop\experiment-timeline

# 3. 로그인
vercel login

# 4. 배포
vercel --prod
```

### 3️⃣ 배포 후 확인 사항

배포가 완료되면 Vercel이 제공하는 URL로 접속:
- 예: `https://experiment-timeline.vercel.app`

**테스트:**
1. PC 브라우저에서 접속
2. 모바일 브라우저에서 접속
3. `olivetti90` / `juicy90` 로그인
4. 데이터 편집 및 체크박스 테스트

## 자동 배포 설정 (GitHub 연동)

GitHub 연동 시 다음과 같이 자동 배포됩니다:

- `main` 브랜치에 push → **프로덕션 배포**
- 다른 브랜치에 push → **프리뷰 배포** (테스트용)

## 모바일 접속

배포 후 모바일에서:
1. 모바일 브라우저 열기 (Chrome, Safari 등)
2. Vercel URL 입력: `https://your-project-name.vercel.app`
3. 홈 화면에 추가 (PWA 느낌)
   - **iOS**: Safari → 공유 → 홈 화면에 추가
   - **Android**: Chrome → 메뉴 → 홈 화면에 추가

## 도메인 설정 (선택)

커스텀 도메인을 원하시면:
1. Vercel 프로젝트 → **Settings** → **Domains**
2. 원하는 도메인 입력 (예: `timeline.rda.kr`)
3. DNS 레코드 설정 (Vercel이 안내)

## 업데이트 방법

### GitHub 연동 시:
```bash
cd C:\Users\user\Desktop\experiment-timeline
git add .
git commit -m "Update features"
git push origin main
```
→ **자동으로 재배포됨!**

### Vercel CLI 시:
```bash
vercel --prod
```

## 환경별 URL

- **프로덕션**: `https://your-project.vercel.app`
- **프리뷰**: `https://your-project-git-branch-name.vercel.app`
- **로컬 개발**: `http://localhost:3000`

## 문제 해결

### 배포 실패 시:
1. Vercel 대시보드 → **Deployments** → 로그 확인
2. Root Directory가 `experiment-timeline`로 설정되었는지 확인
3. `npm run build`가 로컬에서 성공하는지 테스트

### 데이터가 안 보일 때:
1. Supabase 프로젝트가 활성화되어 있는지 확인
2. 브라우저 콘솔(F12)에서 네트워크 에러 확인
3. `init-database.js`를 다시 실행했는지 확인

## 비용

- **무료 티어**: 개인 프로젝트, 무제한 배포
- **대역폭**: 100GB/월 (충분함)
- **빌드 시간**: 6,000분/월 (충분함)

## 보안

- ✅ 자동 HTTPS (SSL 인증서)
- ✅ Supabase anon key는 공개되어도 안전 (RLS 정책)
- ⚠️ 민감한 데이터는 환경 변수로 관리 (필요 시)

## 다음 단계

1. 배포 완료 후 URL 확인
2. 모바일에서 접속 테스트
3. 홈 화면에 추가하여 앱처럼 사용
4. 동료들과 URL 공유

---

문의: Vercel 대시보드에서 실시간 로그 및 분석 확인 가능
