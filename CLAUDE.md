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

### 1. 자동 PR 생성 (필수)

코드 변경을 브랜치에 푸시한 뒤에는 **반드시** PR을 생성해야 합니다. 사용자가 따로 요청하지 않아도 기본 동작으로 PR을 만든다. 단순 질문/탐색 작업이라 커밋이 없을 때는 제외.

### 2. PR 링크 출력

PR을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.

예시:
```
PR이 생성되었습니다: https://github.com/owner/repo/pull/123
```

이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.

### 3. 머지는 모드에 따라 분기

- **편집 수락 모드 (auto-accept)**: PR 생성 직후 `merge_pull_request` MCP 툴을 호출해 **자동으로 머지**까지 끝낸다. 사용자가 별도 요청하지 않아도 기본 동작으로 머지.
- **계획 모드 (plan mode)** 또는 그 외 모드: 머지하지 않고 **사용자에게 머지할지 물어본다.** PR 링크만 제공하고 확인 받은 뒤 `merge_pull_request` 호출.

예외 (편집 수락 모드에서도 머지하지 않고 사용자 확인):
- 충돌 발생 (`mergeable_state !== "clean"`)
- CI 실패
- 사용자가 명시적으로 "머지하지 마" 지시

---

## 벼육종 웹앱 프로젝트 규칙

전역 규칙(`~/.claude/CLAUDE.md`)에 더해 이 프로젝트에 특별히 적용되는 규칙입니다.

### 프로젝트 개요

벼 분자육종 작업 자동화를 위한 웹앱 모음. 단일 HTML 파일 구조(Pyodide + Plotly + XLSX.js).

### 핵심 시스템: 벼 육종 시스템 v4.16/17

- **정확도**: 87.2% (표현형 예측)
- **구현**: 단일 HTML 파일 (`rice_breeding_v4_16_prediction.html`, `rice_breeding_v5_0.html`)
- **탭 구조**: Tab 0~9
  - Tab 0: 데이터 입력
  - Tab 1: 결측치 예측
  - Tab 2: 유전 알고리즘
  - Tab 3: 육종조합 추천
  - Tab 4: 후대예측
  - Tab 5: 시각화
  - Tab 6: 종합 리포트
  - Tab 7: 연관군 분석
  - Tab 8: 유전자 상호작용
  - Tab 9: 세대별 시뮬레이션

#### 핵심 기능

- **연관 기반 교배 시뮬레이션**: Kosambi 함수로 bp→cM 변환, haplotype 추적
- **동원체 재조합 억제**: IRGSP-1.0 기준 12개 염색체별 동원체 위치 반영
- **세대별 연관블록 유지율 분석**: F1→F7 세대 진전
- **멘델 분리**: 1:2:1 분리비, 3가지 선발 전략(자연분리/표현형/MAS)
- **NSGA-II 다목적 최적화**: Pareto Front 기반 교배조합 추천
- **RF Feature Importance**: 유전자 상호작용 분석

#### 절대 금지

- **기존 탭 기능 절대 삭제 금지.** 새 탭/기능만 추가.
- 연관군 데이터: RAP-DB, Gramene 기반.
- 유전체 좌표: IRGSP-1.0 기준.

### ML 파이프라인 (2025.10~ 진행 중)

```
형질 데이터 이진화
   ↓
유전알고리즘으로 다형질 동시개선 최적 유전자형 탐색
   ↓
최적해 도출용 교배조합 계산
   ↓
후대계통 유전자형 시뮬레이션
   ↓
머신러닝(RF/XGBoost/Gradient Boosting)으로 후대 형질 예측
```

#### 적용 형질
- BLB (K1~K3a)
- SLB (잎집무늬마름병)
- BPH (벼멸구)
- PHS (수발아)
- 도열병 (잎/이삭)

#### 외부 검증
- 유전자원 430점

#### 알려진 이슈
- BPH 모델은 qltg3-1 허위 상관(feature importance 0.643) 발견됨. 재검토 필요.

### 농업 조사 통합 도구 사양

#### 라벨 출력 (변경 절대 금지)
- 컬러칩만 변경 가능. 기능 자체는 동결.

#### DMRT 분석 (`DMRT_분석기_v4_6.html`)
- Duncan 다중범위 검정: 정확한 임계값 테이블 사용 (α = 0.05, 0.01, 0.001)
- 그룹별 색상: 같은 그룹 = 같은 색상 (연속적 파란색 그라데이션)
- SE 계산: pooled SE 사용

#### 시각화 옵션
- 차트 크기: mm 단위
- DPI 선택: 72 / 150 / 300 / 600
- 오차 막대: SE / SD / 없음
- Y축 범위·간격, 폰트 크기, 그룹문자 표시, 흑백 모드 모두 옵션화

### 웹앱 기술 스택 표준

- 외부 라이브러리: XLSX.js, QRCode.js, Chart.js, NanumSquare 폰트
- GitHub: `https://github.com/olivettirda/rda`
- 파비콘: `https://raw.githubusercontent.com/olivettirda/rda/refs/heads/main/ssallogo.png`

```html
<link rel="icon" type="image/png"
  href="https://raw.githubusercontent.com/olivettirda/rda/refs/heads/main/ssallogo.png">
```

#### QRCode.js 중복 방지 (반드시 적용)
- CSS에서 canvas 숨김
- innerHTML로 canvas 제거
- html2canvas 사용 시 onclone에서 canvas 삭제

### SNP 데이터 변환 표준

| 입력 | 출력 |
|------|------|
| 반복친(RP) allele | A |
| 공여친(DP) allele | B |
| 이형접합 | H |
| 결측 | - |

마커명 형식: `ChrXX_Position`

### 참조 데이터베이스

- IRGSP-1.0 (벼 참조 게놈)
- RAP-DB
- Gramene
- Rice SNP-Seek
- IWGSC RefSeq v2.1 (밀)

---

## 코드 자산 참고

`code_assets/` 폴더에 이전 작업에서 추출된 핵심 코드 자산이 보관되어 있습니다.
각 폴더의 `README.md`에서 블록 구성을 확인하고 필요한 코드만 골라 사용합니다.
같은 폴더 내 여러 블록은 한 작업의 반복·수정 버전인 경우가 많으므로, 가장 큰 블록 또는 마지막 블록이 최종본일 가능성이 높습니다.

상세 인덱스: `code_assets/INDEX.md`
