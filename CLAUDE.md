# Claude Code Instructions

## 웹앱 UI/UX 디자인 가이드

웹앱을 만들거나 수정할 때 **반드시** `docs/DESIGN_SYSTEM.md` 파일의 디자인 가이드를 참조해야 합니다.

### 핵심 원칙
- **색상**: DMRT 스타일 기반 (`--primary-dark: #0c3026`, `--primary-main: #017f97`)
- **간격**: 8px 기반 시스템
- **타이포그래피**: KoPub Dotum 폰트
- **반응형**: Mobile First 접근법
- **접근성**: WCAG 2.1 AA 준수 (색상 대비 4.5:1 이상)
- **터치 타겟**: 최소 44px

### 필수 확인 사항
1. 버튼, 입력 필드, 카드 등 컴포넌트 스타일 준수
2. 상태별 디자인 (hover, focus, error, disabled)
3. 모달, 토스트, 알림 등 피드백 시스템 일관성
4. 반응형 브레이크포인트 적용

---

## 예약 시스템 템플릿 가이드

현재 구현된 예약 시스템의 구조와 흐름을 다른 예약 시스템 개발 시 템플릿으로 활용할 수 있습니다.

### 시스템 구조 개요

```
[인증 레이어]
    ↓
[자원 관리] ←→ [카테고리 동적 로딩]
    ↓
[예약 폼] → [시간대 선택] → [장바구니]
    ↓
[예약 제출] → [승인 워크플로우] → [예약 확정]
```

### 핵심 컴포넌트

#### 1. 데이터 모델 설계
```javascript
// 자원 엔티티 (예: 장비, 회의실, 차량 등)
{
    id: 'UUID',
    name: '자원명',
    primary_category: '주 카테고리',      // 필수: 그룹핑 기준
    secondary_location: '부 위치',         // 선택: 추가 위치 정보
    metadata_field: '메타데이터',          // 선택: 추가 식별 정보
    status: 'available/maintenance/broken',
    approval_mode: 'auto/manual'
}

// 예약 엔티티
{
    resource_id: 'FK to 자원',
    user_id: 'FK to 사용자',
    category: '카테고리명',
    start_time: 'timestamp',
    end_time: 'timestamp',
    purpose: '예약 목적',
    status: 'pending/approved/rejected'
}
```

#### 2. 동적 카테고리 로딩 패턴
```javascript
// 1. 자원 로드 시 카테고리 자동 추출
async function loadResources() {
    const { data } = await fetchResources();
    resourceList = data;

    // 주요 카테고리 추출
    const categories = [...new Set(data
        .map(r => r.primary_category)
        .filter(c => c && c.trim() !== '')
    )];

    CATEGORIES = categories;
    updateCategoryDropdowns(); // 모든 드롭다운 업데이트
}

// 2. 카테고리 드롭다운 업데이트
function updateCategoryDropdowns() {
    // 예약 폼, 필터, 검색 등 모든 드롭다운 업데이트
    populateDropdown('categorySelect', CATEGORIES);
}
```

#### 3. Excel 업로드/다운로드 패턴
```javascript
// 업로드: 필수 필드 검증 + 중복 체크
async function handleExcelUpload(file) {
    const jsonData = parseExcel(file);

    for (const row of jsonData) {
        const data = {
            name: row['필수필드1'],                    // 필수
            primary_category: row['필수필드2'],        // 필수
            optional_field: row['선택필드(선택)'] || null  // 선택
        };

        // 필수 필드 검증
        if (!data.name || !data.primary_category) {
            errorList.push({ name: data.name, reason: '필수 필드 누락' });
            continue;
        }

        // 중복 체크 (이름 + 카테고리 조합)
        const { data: duplicates } = await checkDuplicate(data.name, data.primary_category);
        if (duplicates.length > 0) {
            errorList.push({ name: data.name, reason: '중복 자원' });
            continue;
        }

        // 데이터 삽입
        await insertResource(data);
    }

    // 결과 로그
    console.log('업로드 결과:', { successCount, errorCount });
    console.log('실패 목록:', JSON.stringify(errorList, null, 2));
}

// 다운로드: 업로드된 데이터 그대로 유지
function exportToExcel() {
    const exportData = resourceList.map(r => ({
        '필수필드1': r.name,
        '필수필드2': r.primary_category,
        '선택필드(선택)': r.optional_field || ''
    }));

    downloadExcel(exportData);
}
```

#### 4. 예약 흐름 구현
```javascript
// Step 1: 카테고리 선택
onCategorySelect() {
    // 선택한 카테고리에 해당하는 자원 필터링
    filteredResources = resourceList.filter(r => r.primary_category === selectedCategory);
    renderResourceGrid(filteredResources);
}

// Step 2: 날짜/시간 선택
onDateSelect() {
    loadAvailableTimeSlots(selectedResource, selectedDate);
}

// Step 3: 장바구니 추가
addToCart() {
    cartItems.push({
        resource_id: selectedResource.id,
        category: selectedCategory,
        date: selectedDate,
        timeSlots: selectedTimeSlots
    });
}

// Step 4: 일괄 예약 제출
async submitReservations() {
    for (const item of cartItems) {
        const reservation = {
            resource_id: findResourceByCategory(item.category),
            start_time: combineDateTime(item.date, item.startTime),
            end_time: combineDateTime(item.date, item.endTime),
            status: getApprovalMode() === 'auto' ? 'approved' : 'pending'
        };

        await insertReservation(reservation);
    }
}
```

#### 5. 자원-카테고리 매칭 패턴
```javascript
// 카테고리명으로 자원 ID 찾기
function findResourceByCategory(categoryName) {
    // 1순위: 주 카테고리 매칭
    let resource = resourceList.find(r => r.primary_category === categoryName);
    if (resource) return resource.id;

    // 2순위: 부 위치 매칭 (하위 호환성)
    resource = resourceList.find(r => r.secondary_location === categoryName);
    if (resource) return resource.id;

    // Fallback: 첫 번째 자원
    return resourceList[0]?.id;
}
```

### 사용자 역할별 기능

#### 일반 사용자
- 자원 검색 및 예약
- 내 예약 조회/취소
- 자원 등록 신청 (승인 대기)

#### 관리자
- 모든 예약 조회/관리
- 예약 승인/거부
- 자원 CRUD
- 사용자 관리
- Excel 일괄 업로드/다운로드

### 필수 구현 사항

#### 1. 상태 관리
```javascript
// 전역 상태
let resourceList = [];          // 자원 목록
let CATEGORIES = [];            // 카테고리 목록 (동적 추출)
let selectedCategory = null;    // 현재 선택된 카테고리
let cartItems = [];             // 장바구니
```

#### 2. 동기화 포인트
```javascript
// 자원 로드 시 모든 관련 UI 업데이트
async function loadResources() {
    await fetchData();
    updateCategories();          // 카테고리 추출
    updateAllDropdowns();        // 모든 드롭다운 동기화
    renderResourceGrid();        // 자원 그리드 렌더링
}
```

#### 3. 검증 레이어
```javascript
// 필수 필드 검증
function validateRequired(data, requiredFields) {
    for (const field of requiredFields) {
        if (!data[field]) {
            return { valid: false, message: `${field} 필드 누락` };
        }
    }
    return { valid: true };
}

// 중복 검증
async function checkDuplicate(identifier1, identifier2) {
    const { data } = await db
        .select('id')
        .eq('field1', identifier1)
        .eq('field2', identifier2);

    return data.length > 0;
}
```

#### 4. 에러 처리
```javascript
// 일괄 작업 시 에러 수집
const successList = [];
const errorList = [];

for (const item of items) {
    try {
        await processItem(item);
        successList.push(item.name);
    } catch (error) {
        errorList.push({
            name: item.name,
            reason: error.message
        });
    }
}

// 결과 로그 출력
console.log('성공:', JSON.stringify(successList, null, 2));
console.log('실패:', JSON.stringify(errorList, null, 2));
```

### UI 상호작용 패턴

#### 1. Tooltip 표시
```html
<!-- 호버 시 추가 정보 표시 -->
<td title="메타정보: ${metadata}" style="cursor: help;">
    ${name}
</td>
```

#### 2. 동적 옵션 생성
```javascript
function populateDropdown(selectId, options) {
    const select = document.getElementById(selectId);
    select.innerHTML = '<option value="">-- 선택 --</option>' +
        options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
}
```

#### 3. 상태 표시
```javascript
function renderStatusBadge(status) {
    const statusMap = {
        'available': { text: '사용가능', class: 'status-success' },
        'maintenance': { text: '점검중', class: 'status-warning' },
        'broken': { text: '고장', class: 'status-error' }
    };

    const { text, class: className } = statusMap[status];
    return `<span class="${className}">${text}</span>`;
}
```

### 디버깅 체크리스트

개발 중 콘솔에서 확인해야 할 로그:
1. ✅ 자원 로드: `console.log('자원 목록:', resourceList.length)`
2. ✅ 카테고리 추출: `console.log('카테고리:', JSON.stringify(CATEGORIES))`
3. ✅ 드롭다운 업데이트: `console.log('드롭다운 생성:', CATEGORIES.length + '개')`
4. ✅ 매칭 결과: `console.log('카테고리 매칭:', resource.id, resource.name)`
5. ✅ 업로드 결과: `console.log('성공/실패:', successCount, errorCount)`

---

## 디버깅 코드 필수 규칙

코드 작성 시 **반드시** 디버깅용 로그를 포함해야 합니다.

### 필수 디버깅 패턴

#### 1. API 호출 시
```javascript
// API 호출 전 - 전송 데이터 출력
console.log('API 요청 데이터:', JSON.stringify(requestData, null, 2));

// API 호출 후 - 에러 상세 출력
if (error) {
    console.error('API 에러:', JSON.stringify(error, null, 2));
}
```

#### 2. 중요 함수 진입 시
```javascript
function importantFunction(param1, param2) {
    console.log('함수 진입:', { param1, param2 });
    // ... 로직
}
```

#### 3. 조건 분기 시
```javascript
if (condition) {
    console.log('분기: condition true');
} else {
    console.log('분기: condition false');
}
```

### 적용 범위
- 모든 API 호출 (Supabase, fetch, axios 등)
- 데이터 변환/처리 함수
- 이벤트 핸들러
- 상태 변경 로직

---

## PR 생성 규칙

PR(Pull Request)을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.

예시:
```
PR이 생성되었습니다: https://github.com/owner/repo/pull/123
```

이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.

---

## 포트폴리오 업데이트 규칙

프로젝트 작업을 진행할 때 **정기적으로** `PORTFOLIO.md` 파일을 업데이트하여 최신 작업 내역을 반영해야 합니다.

### 업데이트 트리거 조건

다음 작업이 완료되었을 때 **반드시** 포트폴리오를 업데이트합니다:

#### 1. 새로운 도구/페이지 추가 (즉시 업데이트)
- 새 HTML 파일 생성 (예: `new_tool.html`)
- 새로운 기능 페이지 추가
- 독립적인 애플리케이션 개발

**업데이트 항목**:
- 섹션 3.1 "웹 기반 도구" 테이블에 행 추가
- 파일 크기 및 라인 수 계산
- 기능 설명 작성

#### 2. 주요 기능 추가/개선 (작업량 5개 이상)
다음 중 **5개 이상의 작업**이 누적되면 업데이트:
- ✅ 새로운 UI 컴포넌트 추가 (모달, 패널, 위젯 등)
- ✅ 주요 기능 추가 (검색, 필터링, 정렬, 내보내기 등)
- ✅ 데이터베이스 스키마 변경
- ✅ API 엔드포인트 추가
- ✅ 인증/권한 시스템 변경
- ✅ 알고리즘 개선 (성능, 정확도)
- ✅ 플랫폼 확장 (웹 → 모바일, 데스크톱 → 웹 등)

**업데이트 항목**:
- 해당 도구의 "주요 기능" 섹션 확장
- 기술 구현 상세 추가
- 최근 업데이트 섹션에 내역 추가

#### 3. 새로운 버전 릴리스 (즉시 업데이트)
- 메이저 버전 업데이트 (v1.x → v2.x)
- 마이너 버전 업데이트 (v1.0 → v1.1)

**업데이트 항목**:
- 섹션 3.2 "데스크톱 & 웹 애플리케이션" 버전 번호 업데이트
- 새로운 기능 목록 추가
- 섹션 9 "최근 업데이트" 갱신

#### 4. 월간 정기 업데이트 (매월 1일)
누적된 작은 변경사항들을 일괄 반영:
- 버그 수정 누적 (10개 이상)
- UI/UX 개선 누적 (5개 이상)
- 리팩토링 작업
- 문서화 개선

**업데이트 항목**:
- 개발 통계 갱신 (섹션 7.1)
- 마일스톤 테이블 업데이트 (섹션 7.3)

### 업데이트 체크리스트

포트폴리오를 업데이트할 때 다음 단계를 따릅니다:

#### Step 1: 작업 내역 수집
```bash
# 최근 커밋 내역 확인 (지난 업데이트 이후)
git log --oneline --since="YYYY-MM-DD" --pretty=format:"%h %s"

# 변경된 파일 목록
git diff --name-status <last-portfolio-commit> HEAD

# 파일 크기 및 라인 수 계산
wc -l <changed-files>
du -h <changed-files>
```

#### Step 2: 항목별 업데이트

**A. 도구 목록 테이블 (섹션 3.1)**
```markdown
| 카테고리 | 도구명 | 크기 | 라인수 | 설명 |
|----------|--------|------|--------|------|
| **새 카테고리** | 새 도구명 | XXkB | X,XXX줄 | 간략 설명 |
```

**B. 애플리케이션 목록 (섹션 3.2)**
```markdown
| 앱명 | 버전 | 플랫폼 | 설명 |
|------|------|--------|------|
| **앱명** | vX.X.X | 플랫폼 | 설명 |
```

**C. 상세 설명 (섹션 4.x)**
- 새로운 기능을 "주요 기능" 하위에 추가
- 코드 예시가 있다면 기술 구현 섹션에 추가
- 중요한 기능은 **볼드** 또는 "(신규)" 표시

**D. 개발 통계 (섹션 7.1)**
```bash
# 총 라인 수 계산
find . -name "*.html" -o -name "*.js" | xargs wc -l | tail -1

# 파일 개수
find . -name "*.html" | wc -l
```

**E. 마일스톤 (섹션 7.3)**
```markdown
| 날짜 | 내용 |
|------|------|
| **YYYY-MM-DD** | 구체적인 작업 내용 (기능명, 도구명 포함) |
```

**F. 최근 업데이트 (섹션 9)**
```markdown
## 9. 최근 업데이트 (YYYY-MM-DD)

### 9.1 [주요 작업명]

**파일**: `path/to/file.html` (X,XXX줄)

**주요 특징**:
- 기능 1
- 기능 2
- 기능 3

**기술 스택**:
```
- 사용된 기술들
```
```

#### Step 3: 검증 및 커밋
```bash
# 포트폴리오 파일 읽기 확인
grep "YYYY-MM-DD" PORTFOLIO.md

# 커밋 메시지 형식
git commit -m "Update portfolio with recent developments

- [변경사항 1]
- [변경사항 2]
- [변경사항 3]
"
```

### 자동화 헬퍼 스크립트

#### 파일 통계 수집
```bash
#!/bin/bash
# portfolio_stats.sh

echo "=== 파일 통계 ==="
echo ""

# HTML 파일 통계
echo "HTML 파일:"
find . -name "*.html" -not -path "./node_modules/*" | while read file; do
    lines=$(wc -l < "$file")
    size=$(du -h "$file" | cut -f1)
    echo "  $file: $size, $lines줄"
done

echo ""

# 데스크톱 앱 통계
echo "데스크톱 앱:"
find sticky_notes_app -name "*.html" -o -name "*.js" | xargs wc -l | tail -1
```

### 업데이트 예시

#### 예시 1: 새 도구 추가
```markdown
작업: 새로운 "유전자 비교 도구" 페이지 생성

1. 섹션 3.1 테이블에 추가:
| **유전자 분석** | 유전자 비교 도구 | 45KB | 1,234줄 | 다중 유전자 비교 분석 |

2. 섹션 4 새 하위섹션 생성:
### 4.X 유전자 비교 도구
(기능 설명 작성)

3. 섹션 7.3 마일스톤 추가:
| **2026-01-15** | 유전자 비교 도구 개발 (1,234줄) |

4. 섹션 9 업데이트:
## 9. 최근 업데이트 (2026-01-15)
### 9.1 유전자 비교 도구 출시
...
```

#### 예시 2: 주요 기능 개선 (5개 작업 누적)
```markdown
누적 작업:
✅ 1. 스티키 노트 - 텍스트 정렬 추가
✅ 2. 스티키 노트 - 폰트 변경 기능
✅ 3. 스티키 노트 - 노트 그룹핑
✅ 4. 스티키 노트 - 노트 전송/수신
✅ 5. 스티키 노트 - 인디케이터 추가

→ 5개 작업 완료, 포트폴리오 업데이트 트리거!

1. 섹션 4.5 "스티키 노트" 업데이트:
**텍스트 편집 기능** (신규):
- 텍스트 정렬 (좌/중/우)
- 폰트 변경

**노트 그룹핑** (신규):
- 핀으로 노트 연결
...

2. 섹션 9 갱신:
## 9. 최근 업데이트 (2026-01-14)
### 9.1 스티키 노트 기능 확장
...
```

### 업데이트 주기 요약

| 트리거 조건 | 업데이트 시점 | 우선순위 |
|-------------|--------------|----------|
| 새 도구/페이지 추가 | 즉시 | 🔴 최우선 |
| 새 버전 릴리스 | 즉시 | 🔴 최우선 |
| 주요 기능 5개 누적 | 5개 달성 시 | 🟡 중간 |
| 월간 정기 업데이트 | 매월 1일 | 🟢 낮음 |

### 주의사항

1. **날짜 정확성**: 항상 현재 날짜 (YYYY-MM-DD) 사용
2. **숫자 정확성**: 파일 크기, 라인 수는 실제 계산값 사용
3. **일관성**: 기존 포맷과 스타일 유지
4. **중복 방지**: 이미 문서화된 기능 재작성 금지
5. **섹션 9 갱신**: 새 업데이트 시 이전 내용을 섹션 7.3으로 이동

---
