# Experiment Timeline Manager - 설치 가이드

## 1. 데이터베이스 설정

### Supabase SQL 편집기에서 스키마 생성

1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택: `jfabgawkxahqcsrwjdgf`
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New query** 버튼 클릭
5. `database-schema.sql` 파일의 내용을 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

### 확인사항

다음 테이블들이 생성되어야 합니다:
- `timeline_users` - 사용자 정보
- `timeline_projects` - 프로젝트
- `timeline_periods` - 시기
- `timeline_items` - 실험 항목
- `timeline_populations` - 집단 정보

## 2. 초기 데이터 생성

### 방법 1: Node.js 스크립트 실행 (권장)

```bash
cd experiment-timeline
node init-database.js
```

이 스크립트는 다음을 수행합니다:
- ✅ 관리자 계정 생성 (admin / 1234)
- ✅ 일반 사용자 생성 (olivetti90 / juicy90)
- ✅ 영진 돌연변이 실험 프로젝트 생성 (olivetti90 계정에)
- ✅ 15개 시기, 50개 실험 항목, 14개 집단 데이터 생성

### 방법 2: 수동 생성

Supabase Dashboard의 Table Editor에서 직접 데이터 입력

#### 1) 사용자 생성

**timeline_users 테이블**

| username | password_hash | email | role |
|----------|---------------|-------|------|
| admin | [bcrypt hash of "1234"] | admin@rda.kr | admin |
| olivetti90 | [bcrypt hash of "juicy90"] | olivetti90@rda.kr | user |

**비밀번호 해싱 방법:**

```javascript
// Node.js에서 실행
const bcrypt = require('bcryptjs');

// admin 비밀번호
console.log(await bcrypt.hash('1234', 10));

// olivetti90 비밀번호
console.log(await bcrypt.hash('juicy90', 10));
```

#### 2) 프로젝트 및 데이터 생성

`init-database.js` 스크립트 사용 권장

## 3. 애플리케이션 실행

```bash
cd experiment-timeline

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:3000 접속
```

## 4. 로그인

### 관리자 계정
- **사용자명**: admin
- **비밀번호**: 1234
- **권한**: 모든 기능 접근 가능

### 일반 사용자 계정
- **사용자명**: olivetti90
- **비밀번호**: juicy90
- **권한**: 자신의 프로젝트만 접근 가능
- **데이터**: 영진 돌연변이 실험 데이터가 미리 저장되어 있음

## 5. 문제 해결

### "RLS policy violation" 오류

Row Level Security (RLS) 정책 문제입니다.

**해결 방법:**
1. Supabase Dashboard → Authentication → Policies
2. 각 테이블의 RLS 정책 확인
3. `database-schema.sql`의 RLS 정책 부분을 다시 실행

### "relation does not exist" 오류

테이블이 생성되지 않았습니다.

**해결 방법:**
1. Supabase SQL Editor에서 `database-schema.sql` 전체를 실행
2. Table Editor에서 테이블 생성 확인

### 로그인 실패

비밀번호 해시 문제일 수 있습니다.

**해결 방법:**
1. `init-database.js` 스크립트를 실행하여 사용자 재생성
2. 또는 Supabase Table Editor에서 직접 password_hash 값 수정

## 6. 기능 확인

로그인 후 다음 기능들이 정상 작동하는지 확인:

- [ ] 타임라인 표시
- [ ] 체크박스 완료 토글
- [ ] 메모 추가/수정
- [ ] 새 항목 추가
- [ ] 항목 삭제
- [ ] 집단 현황 확인
- [ ] 필터 설정 (완료/선택 항목)
- [ ] JSON Export
- [ ] JSON Import
- [ ] 로그아웃

## 7. 다중 사용자 테스트

1. 브라우저 1: olivetti90 로그인 → 영진 실험 데이터 표시
2. 브라우저 2 (시크릿): admin 로그인 → 빈 프로젝트 (관리자는 자신의 프로젝트만 보임)
3. 각 사용자가 다른 데이터를 가지는지 확인

## 8. 배포

### Netlify / Vercel 배포

```bash
# 빌드
npm run build

# dist 폴더를 배포
```

**환경 변수 설정 불필요** (Supabase URL/Key가 코드에 포함되어 있음)

### 주의사항

- Supabase Anon Key는 공개되어도 안전함 (RLS로 보호됨)
- 프로덕션 환경에서는 환경 변수로 관리 권장

## 9. 추가 사용자 생성

관리자로 로그인 후 Supabase Dashboard에서 직접 생성하거나,
회원가입 기능을 추가로 구현할 수 있습니다.

```javascript
// 회원가입 예제
import { signUp } from './lib/auth';

await signUp('newuser', 'password123', 'user@example.com', 'user');
```

## 10. 데이터 백업

### JSON Export 사용
- 헤더의 "Export" 버튼 클릭
- JSON 파일 다운로드
- 안전한 곳에 보관

### Supabase Backup
- Supabase Dashboard → Settings → Database → Backups
- 자동 백업 설정 확인
