# 실험 일정 관리 웹앱 (Experiment Timeline Manager)

육종 연구 실험 일정을 시각적 타임라인으로 관리하는 웹 애플리케이션

## 주요 기능

- ✅ **사용자 인증** - 로그인/로그아웃, 사용자별 데이터 관리
- ✅ **세로 타임라인 뷰** - 시기별 실험 항목을 시간 순으로 표시
- ✅ **체크박스** - 실험 완료 여부 추적
- ✅ **메모 기능** - 각 항목에 메모 추가/수정
- ✅ **집단 관리** - 관리 중인 집단 현황 한눈에 파악
- ✅ **Supabase 연동** - 클라우드 데이터베이스에 실시간 저장
- ✅ **다중 기기 동기화** - PC, 모바일 등 여러 기기에서 접근 가능
- ✅ **JSON Export/Import** - 데이터 백업 및 복원
- ✅ **필터링** - 완료/미완료, 필수/선택 항목 필터
- ✅ **진행률 표시** - 전체 및 시기별 진행률 시각화
- ✅ **역할 기반 접근** - 관리자/일반 사용자 권한 관리

## 기술 스택

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (DMRT 커스텀 컬러)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Backend**: Supabase (PostgreSQL + Row Level Security)
- **Authentication**: Custom username/password with bcrypt
- **Security**: RLS policies, password hashing

## 설치 및 실행

### 1. 의존성 설치

```bash
cd experiment-timeline
npm install
```

### 2. 데이터베이스 설정

**⚠️ 중요: 먼저 Supabase에 테이블을 생성해야 합니다!**

자세한 내용은 [SETUP.md](./SETUP.md) 참조

#### 간단 설정 (권장)

```bash
# Supabase에서 database-schema.sql 실행 후
node init-database.js
```

이 스크립트는 다음을 자동으로 생성합니다:
- ✅ 관리자 계정: `admin` / `1234`
- ✅ 일반 사용자: `olivetti90` / `juicy90`
- ✅ 영진 돌연변이 실험 데이터 (50개 항목, 14개 집단)

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 4. 로그인

#### 관리자 계정
- 사용자명: `admin`
- 비밀번호: `1234`

#### 일반 사용자 (영진 실험 데이터 포함)
- 사용자명: `olivetti90`
- 비밀번호: `juicy90`

## 프로젝트 구조

```
experiment-timeline/
├── src/
│   ├── components/
│   │   ├── Login.jsx               # 로그인 화면
│   │   ├── Header.jsx              # 헤더 (사용자 정보, 로그아웃)
│   │   ├── Timeline.jsx            # 메인 타임라인
│   │   ├── TimelinePeriod.jsx      # 시기별 그룹
│   │   ├── TimelineItem.jsx        # 개별 실험 항목
│   │   └── PopulationTracker.jsx   # 집단 현황 사이드바
│   ├── lib/
│   │   ├── supabaseClient.js       # Supabase 클라이언트
│   │   ├── auth.js                 # 인증 함수
│   │   └── supabaseApi.js          # API 함수
│   ├── hooks/
│   │   └── useExperiments.js       # 실험 데이터 관리 훅
│   ├── utils/
│   │   ├── storage.js              # 저장소 유틸리티
│   │   └── helpers.js              # 헬퍼 함수
│   ├── data/
│   │   └── initialData.js          # 초기 데이터 (영진 실험)
│   ├── App.jsx                     # 메인 앱 컴포넌트
│   ├── main.jsx                    # 엔트리 포인트
│   └── index.css                   # 글로벌 스타일
├── database-schema.sql             # 데이터베이스 스키마
├── init-database.js                # 초기 데이터 생성 스크립트
├── SETUP.md                        # 상세 설치 가이드
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 데이터베이스 스키마

### 테이블 구조

1. **timeline_users** - 사용자 정보
   - username, password_hash, email, role

2. **timeline_projects** - 프로젝트
   - user_id, project_name, description, settings

3. **timeline_periods** - 시기
   - project_id, name, short_name, start_date, end_date, display_order

4. **timeline_items** - 실험 항목
   - period_id, title, description, priority, completed, memo, tags, populations

5. **timeline_populations** - 집단 정보
   - project_id, name, parent_population, current_status, active_periods, notes

### Row Level Security (RLS)

모든 테이블에 RLS 정책이 적용되어 있습니다:
- 사용자는 자신의 데이터만 조회/수정 가능
- 관리자는 모든 사용자 조회 가능 (하지만 다른 사용자의 프로젝트는 볼 수 없음)

## 사용 방법

### 1. 로그인
- 로그인 화면에서 사용자명과 비밀번호 입력
- 세션은 24시간 유지

### 2. 실험 항목 체크
- 완료된 항목의 체크박스를 클릭
- 완료 시각이 자동으로 기록됨
- 데이터는 Supabase에 실시간 저장

### 3. 메모 추가
- 각 항목 우측의 메모 아이콘(✏️) 클릭
- 메모 입력 후 저장 버튼 클릭
- 메모는 즉시 데이터베이스에 저장

### 4. 새 항목 추가
- 각 시기 헤더의 "추가" 버튼 클릭
- 제목과 설명 입력 후 추가
- 항목은 즉시 데이터베이스에 저장

### 5. 데이터 관리
- **Export**: 헤더의 Export 버튼으로 JSON 파일 다운로드
- **Import**: Import 버튼으로 JSON 파일 업로드 및 복원
- **Reset**: 초기 데이터로 재설정 (주의: 현재 데이터 삭제됨)

### 6. 필터링
- 사이드바에서 완료 항목 표시/숨김 설정
- 선택 항목 표시/숨김 설정
- 집단별 검색 및 필터

### 7. 로그아웃
- 헤더 우측의 "로그아웃" 버튼 클릭
- 세션이 종료되고 로그인 화면으로 이동

## 다중 기기 동기화

Supabase를 사용하므로 자동으로 동기화됩니다:
- PC에서 작업 → 모바일에서 즉시 확인 가능
- 여러 기기에서 동시에 작업 가능
- 인터넷 연결만 있으면 어디서든 접근

## DMRT 디자인 시스템

이 프로젝트는 DMRT 스타일 가이드를 따릅니다:

- **Primary Dark**: `#0c3026` - 헤더, 필수 항목 강조
- **Primary Main**: `#017f97` - 주요 액션, 링크
- **Accent Colors**: `#00a1b8`, `#54b7c6` - 활성 상태, 선택 항목
- **Font**: KoPub Dotum
- **Spacing**: 8px 기반 시스템
- **Touch Target**: 최소 44px (접근성 준수)
- **Accessibility**: WCAG 2.1 AA (색상 대비 4.5:1 이상)

## 프로덕션 배포

### Netlify / Vercel

```bash
# 빌드
npm run build

# dist 폴더를 배포
```

**환경 변수 설정:** 불필요 (Supabase URL/Key가 코드에 포함)

### 보안 고려사항

- Supabase Anon Key는 공개되어도 안전함 (RLS로 보호)
- 비밀번호는 bcrypt로 해싱되어 저장
- Row Level Security로 데이터 접근 제어

## 문제 해결

### "RLS policy violation" 오류
- Supabase Dashboard에서 RLS 정책 확인
- `database-schema.sql`의 RLS 부분 재실행

### "relation does not exist" 오류
- 테이블이 생성되지 않음
- Supabase SQL Editor에서 `database-schema.sql` 전체 실행

### 로그인 실패
- `init-database.js` 스크립트로 사용자 재생성
- 또는 Supabase Table Editor에서 password_hash 확인

자세한 문제 해결 방법은 [SETUP.md](./SETUP.md) 참조

## 브라우저 지원

- Chrome/Edge (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)

## 라이선스

MIT License

## 개발자

RDA (농촌진흥청) - 육종 연구팀

## 참고 자료

- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [DMRT Design System](../docs/DESIGN_SYSTEM.md)
