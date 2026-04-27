# CLAUDE.md 진화 기록

_생성일: 2026-04-27_

---

## 1. 현재 버전 (HEAD)

```markdown
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

```

---

## 2. 변경 이력 (`git log -p CLAUDE.md`)

commit 175e36dac9aaa30acd92a2b7f1879b05cd48a0a5
Author: Claude <noreply@anthropic.com>
Date:   Fri Apr 17 01:39:47 2026 +0000

    CLAUDE.md: 머지 규칙을 모드별로 분기
    
    편집 수락 모드에서는 자동 머지, 계획 모드 등에서는 사용자 확인 후 머지.

diff --git a/CLAUDE.md b/CLAUDE.md
index b20d27c..a464776 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -375,11 +375,12 @@ PR이 생성되었습니다: https://github.com/owner/repo/pull/123
 
 이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.
 
-### 3. 머지도 자동 수행
+### 3. 머지는 모드에 따라 분기
 
-편집 수락 모드(auto-accept)로 동작하는 세션에서는 PR 생성 직후 `merge_pull_request` MCP 툴을 호출해 **자동으로 머지**까지 끝낸다. 사용자가 별도 요청하지 않아도 기본 동작으로 머지한다.
+- **편집 수락 모드 (auto-accept)**: PR 생성 직후 `merge_pull_request` MCP 툴을 호출해 **자동으로 머지**까지 끝낸다. 사용자가 별도 요청하지 않아도 기본 동작으로 머지.
+- **계획 모드 (plan mode)** 또는 그 외 모드: 머지하지 않고 **사용자에게 머지할지 물어본다.** PR 링크만 제공하고 확인 받은 뒤 `merge_pull_request` 호출.
 
-예외 (머지하지 않고 사용자 확인 요청):
+예외 (편집 수락 모드에서도 머지하지 않고 사용자 확인):
 - 충돌 발생 (`mergeable_state !== "clean"`)
 - CI 실패
 - 사용자가 명시적으로 "머지하지 마" 지시

commit c61b4114aa6463b18d7c43abecc0c487d7554979
Author: Claude <noreply@anthropic.com>
Date:   Fri Apr 17 01:39:04 2026 +0000

    CLAUDE.md: 머지도 자동 수행 규칙으로 변경
    
    편집 수락 모드 세션에서는 PR 생성 후 자동으로 머지까지 완료한다.
    충돌·CI 실패·명시적 지시가 있을 때만 예외.

diff --git a/CLAUDE.md b/CLAUDE.md
index f183c42..b20d27c 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -375,6 +375,11 @@ PR이 생성되었습니다: https://github.com/owner/repo/pull/123
 
 이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.
 
-### 3. 머지는 반드시 사용자 확인 후 수행
+### 3. 머지도 자동 수행
 
-PR 생성은 자동이지만, **머지(merge)는 절대 자동으로 수행하지 않는다.** 사용자가 "머지해줘" 같이 명시적으로 요청했을 때만 `merge_pull_request` MCP 툴을 호출한다. 그 외에는 PR 링크만 제공하고 사용자가 GitHub에서 검토하도록 둔다.
+편집 수락 모드(auto-accept)로 동작하는 세션에서는 PR 생성 직후 `merge_pull_request` MCP 툴을 호출해 **자동으로 머지**까지 끝낸다. 사용자가 별도 요청하지 않아도 기본 동작으로 머지한다.
+
+예외 (머지하지 않고 사용자 확인 요청):
+- 충돌 발생 (`mergeable_state !== "clean"`)
+- CI 실패
+- 사용자가 명시적으로 "머지하지 마" 지시

commit 1cee46eb864ba25a5373df6c6516449f46ec689f
Author: Claude <noreply@anthropic.com>
Date:   Fri Apr 17 01:36:22 2026 +0000

    CLAUDE.md: PR 머지는 사용자 확인 후 수행 규칙 추가
    
    PR 생성은 자동이지만 머지는 명시적 요청이 있을 때만 MCP 툴로 수행하도록
    규칙을 명시한다.

diff --git a/CLAUDE.md b/CLAUDE.md
index 491d6e5..f183c42 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -374,3 +374,7 @@ PR이 생성되었습니다: https://github.com/owner/repo/pull/123
 ```
 
 이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.
+
+### 3. 머지는 반드시 사용자 확인 후 수행
+
+PR 생성은 자동이지만, **머지(merge)는 절대 자동으로 수행하지 않는다.** 사용자가 "머지해줘" 같이 명시적으로 요청했을 때만 `merge_pull_request` MCP 툴을 호출한다. 그 외에는 PR 링크만 제공하고 사용자가 GitHub에서 검토하도록 둔다.

commit bff534d46f7a1e85d8de664d3fff289a728bebe1
Author: Claude <noreply@anthropic.com>
Date:   Fri Apr 17 01:00:00 2026 +0000

    PR 자동 생성 규칙을 CLAUDE.md에 명시
    
    푸시 후 별도 요청 없이도 기본 동작으로 PR을 생성하도록 규칙 추가.

diff --git a/CLAUDE.md b/CLAUDE.md
index 683f200..491d6e5 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -360,7 +360,13 @@ if (condition) {
 
 ## PR 생성 규칙
 
-PR(Pull Request)을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.
+### 1. 자동 PR 생성 (필수)
+
+코드 변경을 브랜치에 푸시한 뒤에는 **반드시** PR을 생성해야 합니다. 사용자가 따로 요청하지 않아도 기본 동작으로 PR을 만든다. 단순 질문/탐색 작업이라 커밋이 없을 때는 제외.
+
+### 2. PR 링크 출력
+
+PR을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.
 
 예시:
 ```

commit a8a30b16833f64a41c62d23ae7847a87db0f7fc6
Author: Claude <noreply@anthropic.com>
Date:   Mon Jan 26 04:48:10 2026 +0000

    Fix XSS vulnerabilities in updateAllSelects()
    
    Apply escapeHtml() to phenotypeNames in:
    - quickTestTrait dropdown (model test)
    - objectiveCheckboxes (genetic algorithm)
    - interactionTrait dropdown (interaction analysis)

diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..683f200
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,370 @@
+# Claude Code Instructions
+
+## 웹앱 UI/UX 디자인 가이드
+
+웹앱을 만들거나 수정할 때 **반드시** `docs/DESIGN_SYSTEM.md` 파일의 디자인 가이드를 참조해야 합니다.
+
+### 핵심 원칙
+- **색상**: DMRT 스타일 기반 (`--primary-dark: #0c3026`, `--primary-main: #017f97`)
+- **간격**: 8px 기반 시스템
+- **타이포그래피**: KoPub Dotum 폰트
+- **반응형**: Mobile First 접근법
+- **접근성**: WCAG 2.1 AA 준수 (색상 대비 4.5:1 이상)
+- **터치 타겟**: 최소 44px
+
+### 필수 확인 사항
+1. 버튼, 입력 필드, 카드 등 컴포넌트 스타일 준수
+2. 상태별 디자인 (hover, focus, error, disabled)
+3. 모달, 토스트, 알림 등 피드백 시스템 일관성
+4. 반응형 브레이크포인트 적용
+
+---
+
+## 예약 시스템 템플릿 가이드
+
+현재 구현된 예약 시스템의 구조와 흐름을 다른 예약 시스템 개발 시 템플릿으로 활용할 수 있습니다.
+
+### 시스템 구조 개요
+
+```
+[인증 레이어]
+    ↓
+[자원 관리] ←→ [카테고리 동적 로딩]
+    ↓
+[예약 폼] → [시간대 선택] → [장바구니]
+    ↓
+[예약 제출] → [승인 워크플로우] → [예약 확정]
+```
+
+### 핵심 컴포넌트
+
+#### 1. 데이터 모델 설계
+```javascript
+// 자원 엔티티 (예: 장비, 회의실, 차량 등)
+{
+    id: 'UUID',
+    name: '자원명',
+    primary_category: '주 카테고리',      // 필수: 그룹핑 기준
+    secondary_location: '부 위치',         // 선택: 추가 위치 정보
+    metadata_field: '메타데이터',          // 선택: 추가 식별 정보
+    status: 'available/maintenance/broken',
+    approval_mode: 'auto/manual'
+}
+
+// 예약 엔티티
+{
+    resource_id: 'FK to 자원',
+    user_id: 'FK to 사용자',
+    category: '카테고리명',
+    start_time: 'timestamp',
+    end_time: 'timestamp',
+    purpose: '예약 목적',
+    status: 'pending/approved/rejected'
+}
+```
+
+#### 2. 동적 카테고리 로딩 패턴
+```javascript
+// 1. 자원 로드 시 카테고리 자동 추출
+async function loadResources() {
+    const { data } = await fetchResources();
+    resourceList = data;
+
+    // 주요 카테고리 추출
+    const categories = [...new Set(data
+        .map(r => r.primary_category)
+        .filter(c => c && c.trim() !== '')
+    )];
+
+    CATEGORIES = categories;
+    updateCategoryDropdowns(); // 모든 드롭다운 업데이트
+}
+
+// 2. 카테고리 드롭다운 업데이트
+function updateCategoryDropdowns() {
+    // 예약 폼, 필터, 검색 등 모든 드롭다운 업데이트
+    populateDropdown('categorySelect', CATEGORIES);
+}
+```
+
+#### 3. Excel 업로드/다운로드 패턴
+```javascript
+// 업로드: 필수 필드 검증 + 중복 체크
+async function handleExcelUpload(file) {
+    const jsonData = parseExcel(file);
+
+    for (const row of jsonData) {
+        const data = {
+            name: row['필수필드1'],                    // 필수
+            primary_category: row['필수필드2'],        // 필수
+            optional_field: row['선택필드(선택)'] || null  // 선택
+        };
+
+        // 필수 필드 검증
+        if (!data.name || !data.primary_category) {
+            errorList.push({ name: data.name, reason: '필수 필드 누락' });
+            continue;
+        }
+
+        // 중복 체크 (이름 + 카테고리 조합)
+        const { data: duplicates } = await checkDuplicate(data.name, data.primary_category);
+        if (duplicates.length > 0) {
+            errorList.push({ name: data.name, reason: '중복 자원' });
+            continue;
+        }
+
+        // 데이터 삽입
+        await insertResource(data);
+    }
+
+    // 결과 로그
+    console.log('업로드 결과:', { successCount, errorCount });
+    console.log('실패 목록:', JSON.stringify(errorList, null, 2));
+}
+
+// 다운로드: 업로드된 데이터 그대로 유지
+function exportToExcel() {
+    const exportData = resourceList.map(r => ({
+        '필수필드1': r.name,
+        '필수필드2': r.primary_category,
+        '선택필드(선택)': r.optional_field || ''
+    }));
+
+    downloadExcel(exportData);
+}
+```
+
+#### 4. 예약 흐름 구현
+```javascript
+// Step 1: 카테고리 선택
+onCategorySelect() {
+    // 선택한 카테고리에 해당하는 자원 필터링
+    filteredResources = resourceList.filter(r => r.primary_category === selectedCategory);
+    renderResourceGrid(filteredResources);
+}
+
+// Step 2: 날짜/시간 선택
+onDateSelect() {
+    loadAvailableTimeSlots(selectedResource, selectedDate);
+}
+
+// Step 3: 장바구니 추가
+addToCart() {
+    cartItems.push({
+        resource_id: selectedResource.id,
+        category: selectedCategory,
+        date: selectedDate,
+        timeSlots: selectedTimeSlots
+    });
+}
+
+// Step 4: 일괄 예약 제출
+async submitReservations() {
+    for (const item of cartItems) {
+        const reservation = {
+            resource_id: findResourceByCategory(item.category),
+            start_time: combineDateTime(item.date, item.startTime),
+            end_time: combineDateTime(item.date, item.endTime),
+            status: getApprovalMode() === 'auto' ? 'approved' : 'pending'
+        };
+
+        await insertReservation(reservation);
+    }
+}
+```
+
+#### 5. 자원-카테고리 매칭 패턴
+```javascript
+// 카테고리명으로 자원 ID 찾기
+function findResourceByCategory(categoryName) {
+    // 1순위: 주 카테고리 매칭
+    let resource = resourceList.find(r => r.primary_category === categoryName);
+    if (resource) return resource.id;
+
+    // 2순위: 부 위치 매칭 (하위 호환성)
+    resource = resourceList.find(r => r.secondary_location === categoryName);
+    if (resource) return resource.id;
+
+    // Fallback: 첫 번째 자원
+    return resourceList[0]?.id;
+}
+```
+
+### 사용자 역할별 기능
+
+#### 일반 사용자
+- 자원 검색 및 예약
+- 내 예약 조회/취소
+- 자원 등록 신청 (승인 대기)
+
+#### 관리자
+- 모든 예약 조회/관리
+- 예약 승인/거부
+- 자원 CRUD
+- 사용자 관리
+- Excel 일괄 업로드/다운로드
+
+### 필수 구현 사항
+
+#### 1. 상태 관리
+```javascript
+// 전역 상태
+let resourceList = [];          // 자원 목록
+let CATEGORIES = [];            // 카테고리 목록 (동적 추출)
+let selectedCategory = null;    // 현재 선택된 카테고리
+let cartItems = [];             // 장바구니
+```
+
+#### 2. 동기화 포인트
+```javascript
+// 자원 로드 시 모든 관련 UI 업데이트
+async function loadResources() {
+    await fetchData();
+    updateCategories();          // 카테고리 추출
+    updateAllDropdowns();        // 모든 드롭다운 동기화
+    renderResourceGrid();        // 자원 그리드 렌더링
+}
+```
+
+#### 3. 검증 레이어
+```javascript
+// 필수 필드 검증
+function validateRequired(data, requiredFields) {
+    for (const field of requiredFields) {
+        if (!data[field]) {
+            return { valid: false, message: `${field} 필드 누락` };
+        }
+    }
+    return { valid: true };
+}
+
+// 중복 검증
+async function checkDuplicate(identifier1, identifier2) {
+    const { data } = await db
+        .select('id')
+        .eq('field1', identifier1)
+        .eq('field2', identifier2);
+
+    return data.length > 0;
+}
+```
+
+#### 4. 에러 처리
+```javascript
+// 일괄 작업 시 에러 수집
+const successList = [];
+const errorList = [];
+
+for (const item of items) {
+    try {
+        await processItem(item);
+        successList.push(item.name);
+    } catch (error) {
+        errorList.push({
+            name: item.name,
+            reason: error.message
+        });
+    }
+}
+
+// 결과 로그 출력
+console.log('성공:', JSON.stringify(successList, null, 2));
+console.log('실패:', JSON.stringify(errorList, null, 2));
+```
+
+### UI 상호작용 패턴
+
+#### 1. Tooltip 표시
+```html
+<!-- 호버 시 추가 정보 표시 -->
+<td title="메타정보: ${metadata}" style="cursor: help;">
+    ${name}
+</td>
+```
+
+#### 2. 동적 옵션 생성
+```javascript
+function populateDropdown(selectId, options) {
+    const select = document.getElementById(selectId);
+    select.innerHTML = '<option value="">-- 선택 --</option>' +
+        options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
+}
+```
+
+#### 3. 상태 표시
+```javascript
+function renderStatusBadge(status) {
+    const statusMap = {
+        'available': { text: '사용가능', class: 'status-success' },
+        'maintenance': { text: '점검중', class: 'status-warning' },
+        'broken': { text: '고장', class: 'status-error' }
+    };
+
+    const { text, class: className } = statusMap[status];
+    return `<span class="${className}">${text}</span>`;
+}
+```
+
+### 디버깅 체크리스트
+
+개발 중 콘솔에서 확인해야 할 로그:
+1. ✅ 자원 로드: `console.log('자원 목록:', resourceList.length)`
+2. ✅ 카테고리 추출: `console.log('카테고리:', JSON.stringify(CATEGORIES))`
+3. ✅ 드롭다운 업데이트: `console.log('드롭다운 생성:', CATEGORIES.length + '개')`
+4. ✅ 매칭 결과: `console.log('카테고리 매칭:', resource.id, resource.name)`
+5. ✅ 업로드 결과: `console.log('성공/실패:', successCount, errorCount)`
+
+---
+
+## 디버깅 코드 필수 규칙
+
+코드 작성 시 **반드시** 디버깅용 로그를 포함해야 합니다.
+
+### 필수 디버깅 패턴
+
+#### 1. API 호출 시
+```javascript
+// API 호출 전 - 전송 데이터 출력
+console.log('API 요청 데이터:', JSON.stringify(requestData, null, 2));
+
+// API 호출 후 - 에러 상세 출력
+if (error) {
+    console.error('API 에러:', JSON.stringify(error, null, 2));
+}
+```
+
+#### 2. 중요 함수 진입 시
+```javascript
+function importantFunction(param1, param2) {
+    console.log('함수 진입:', { param1, param2 });
+    // ... 로직
+}
+```
+
+#### 3. 조건 분기 시
+```javascript
+if (condition) {
+    console.log('분기: condition true');
+} else {
+    console.log('분기: condition false');
+}
+```
+
+### 적용 범위
+- 모든 API 호출 (Supabase, fetch, axios 등)
+- 데이터 변환/처리 함수
+- 이벤트 핸들러
+- 상태 변경 로직
+
+---
+
+## PR 생성 규칙
+
+PR(Pull Request)을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.
+
+예시:
+```
+PR이 생성되었습니다: https://github.com/owner/repo/pull/123
+```
+
+이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.

commit c997a7089d11081ce431fdc3e75f35c845536a0c
Author: olivettirda <kagglenon@gmail.com>
Date:   Wed Jan 21 18:47:16 2026 +0900

    Merge pull request #232 from olivettirda/claude/restore-desktop-features-4e1cR
    
    Fix masonry layout to use default note width

diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..683f200
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,370 @@
+# Claude Code Instructions
+
+## 웹앱 UI/UX 디자인 가이드
+
+웹앱을 만들거나 수정할 때 **반드시** `docs/DESIGN_SYSTEM.md` 파일의 디자인 가이드를 참조해야 합니다.
+
+### 핵심 원칙
+- **색상**: DMRT 스타일 기반 (`--primary-dark: #0c3026`, `--primary-main: #017f97`)
+- **간격**: 8px 기반 시스템
+- **타이포그래피**: KoPub Dotum 폰트
+- **반응형**: Mobile First 접근법
+- **접근성**: WCAG 2.1 AA 준수 (색상 대비 4.5:1 이상)
+- **터치 타겟**: 최소 44px
+
+### 필수 확인 사항
+1. 버튼, 입력 필드, 카드 등 컴포넌트 스타일 준수
+2. 상태별 디자인 (hover, focus, error, disabled)
+3. 모달, 토스트, 알림 등 피드백 시스템 일관성
+4. 반응형 브레이크포인트 적용
+
+---
+
+## 예약 시스템 템플릿 가이드
+
+현재 구현된 예약 시스템의 구조와 흐름을 다른 예약 시스템 개발 시 템플릿으로 활용할 수 있습니다.
+
+### 시스템 구조 개요
+
+```
+[인증 레이어]
+    ↓
+[자원 관리] ←→ [카테고리 동적 로딩]
+    ↓
+[예약 폼] → [시간대 선택] → [장바구니]
+    ↓
+[예약 제출] → [승인 워크플로우] → [예약 확정]
+```
+
+### 핵심 컴포넌트
+
+#### 1. 데이터 모델 설계
+```javascript
+// 자원 엔티티 (예: 장비, 회의실, 차량 등)
+{
+    id: 'UUID',
+    name: '자원명',
+    primary_category: '주 카테고리',      // 필수: 그룹핑 기준
+    secondary_location: '부 위치',         // 선택: 추가 위치 정보
+    metadata_field: '메타데이터',          // 선택: 추가 식별 정보
+    status: 'available/maintenance/broken',
+    approval_mode: 'auto/manual'
+}
+
+// 예약 엔티티
+{
+    resource_id: 'FK to 자원',
+    user_id: 'FK to 사용자',
+    category: '카테고리명',
+    start_time: 'timestamp',
+    end_time: 'timestamp',
+    purpose: '예약 목적',
+    status: 'pending/approved/rejected'
+}
+```
+
+#### 2. 동적 카테고리 로딩 패턴
+```javascript
+// 1. 자원 로드 시 카테고리 자동 추출
+async function loadResources() {
+    const { data } = await fetchResources();
+    resourceList = data;
+
+    // 주요 카테고리 추출
+    const categories = [...new Set(data
+        .map(r => r.primary_category)
+        .filter(c => c && c.trim() !== '')
+    )];
+
+    CATEGORIES = categories;
+    updateCategoryDropdowns(); // 모든 드롭다운 업데이트
+}
+
+// 2. 카테고리 드롭다운 업데이트
+function updateCategoryDropdowns() {
+    // 예약 폼, 필터, 검색 등 모든 드롭다운 업데이트
+    populateDropdown('categorySelect', CATEGORIES);
+}
+```
+
+#### 3. Excel 업로드/다운로드 패턴
+```javascript
+// 업로드: 필수 필드 검증 + 중복 체크
+async function handleExcelUpload(file) {
+    const jsonData = parseExcel(file);
+
+    for (const row of jsonData) {
+        const data = {
+            name: row['필수필드1'],                    // 필수
+            primary_category: row['필수필드2'],        // 필수
+            optional_field: row['선택필드(선택)'] || null  // 선택
+        };
+
+        // 필수 필드 검증
+        if (!data.name || !data.primary_category) {
+            errorList.push({ name: data.name, reason: '필수 필드 누락' });
+            continue;
+        }
+
+        // 중복 체크 (이름 + 카테고리 조합)
+        const { data: duplicates } = await checkDuplicate(data.name, data.primary_category);
+        if (duplicates.length > 0) {
+            errorList.push({ name: data.name, reason: '중복 자원' });
+            continue;
+        }
+
+        // 데이터 삽입
+        await insertResource(data);
+    }
+
+    // 결과 로그
+    console.log('업로드 결과:', { successCount, errorCount });
+    console.log('실패 목록:', JSON.stringify(errorList, null, 2));
+}
+
+// 다운로드: 업로드된 데이터 그대로 유지
+function exportToExcel() {
+    const exportData = resourceList.map(r => ({
+        '필수필드1': r.name,
+        '필수필드2': r.primary_category,
+        '선택필드(선택)': r.optional_field || ''
+    }));
+
+    downloadExcel(exportData);
+}
+```
+
+#### 4. 예약 흐름 구현
+```javascript
+// Step 1: 카테고리 선택
+onCategorySelect() {
+    // 선택한 카테고리에 해당하는 자원 필터링
+    filteredResources = resourceList.filter(r => r.primary_category === selectedCategory);
+    renderResourceGrid(filteredResources);
+}
+
+// Step 2: 날짜/시간 선택
+onDateSelect() {
+    loadAvailableTimeSlots(selectedResource, selectedDate);
+}
+
+// Step 3: 장바구니 추가
+addToCart() {
+    cartItems.push({
+        resource_id: selectedResource.id,
+        category: selectedCategory,
+        date: selectedDate,
+        timeSlots: selectedTimeSlots
+    });
+}
+
+// Step 4: 일괄 예약 제출
+async submitReservations() {
+    for (const item of cartItems) {
+        const reservation = {
+            resource_id: findResourceByCategory(item.category),
+            start_time: combineDateTime(item.date, item.startTime),
+            end_time: combineDateTime(item.date, item.endTime),
+            status: getApprovalMode() === 'auto' ? 'approved' : 'pending'
+        };
+
+        await insertReservation(reservation);
+    }
+}
+```
+
+#### 5. 자원-카테고리 매칭 패턴
+```javascript
+// 카테고리명으로 자원 ID 찾기
+function findResourceByCategory(categoryName) {
+    // 1순위: 주 카테고리 매칭
+    let resource = resourceList.find(r => r.primary_category === categoryName);
+    if (resource) return resource.id;
+
+    // 2순위: 부 위치 매칭 (하위 호환성)
+    resource = resourceList.find(r => r.secondary_location === categoryName);
+    if (resource) return resource.id;
+
+    // Fallback: 첫 번째 자원
+    return resourceList[0]?.id;
+}
+```
+
+### 사용자 역할별 기능
+
+#### 일반 사용자
+- 자원 검색 및 예약
+- 내 예약 조회/취소
+- 자원 등록 신청 (승인 대기)
+
+#### 관리자
+- 모든 예약 조회/관리
+- 예약 승인/거부
+- 자원 CRUD
+- 사용자 관리
+- Excel 일괄 업로드/다운로드
+
+### 필수 구현 사항
+
+#### 1. 상태 관리
+```javascript
+// 전역 상태
+let resourceList = [];          // 자원 목록
+let CATEGORIES = [];            // 카테고리 목록 (동적 추출)
+let selectedCategory = null;    // 현재 선택된 카테고리
+let cartItems = [];             // 장바구니
+```
+
+#### 2. 동기화 포인트
+```javascript
+// 자원 로드 시 모든 관련 UI 업데이트
+async function loadResources() {
+    await fetchData();
+    updateCategories();          // 카테고리 추출
+    updateAllDropdowns();        // 모든 드롭다운 동기화
+    renderResourceGrid();        // 자원 그리드 렌더링
+}
+```
+
+#### 3. 검증 레이어
+```javascript
+// 필수 필드 검증
+function validateRequired(data, requiredFields) {
+    for (const field of requiredFields) {
+        if (!data[field]) {
+            return { valid: false, message: `${field} 필드 누락` };
+        }
+    }
+    return { valid: true };
+}
+
+// 중복 검증
+async function checkDuplicate(identifier1, identifier2) {
+    const { data } = await db
+        .select('id')
+        .eq('field1', identifier1)
+        .eq('field2', identifier2);
+
+    return data.length > 0;
+}
+```
+
+#### 4. 에러 처리
+```javascript
+// 일괄 작업 시 에러 수집
+const successList = [];
+const errorList = [];
+
+for (const item of items) {
+    try {
+        await processItem(item);
+        successList.push(item.name);
+    } catch (error) {
+        errorList.push({
+            name: item.name,
+            reason: error.message
+        });
+    }
+}
+
+// 결과 로그 출력
+console.log('성공:', JSON.stringify(successList, null, 2));
+console.log('실패:', JSON.stringify(errorList, null, 2));
+```
+
+### UI 상호작용 패턴
+
+#### 1. Tooltip 표시
+```html
+<!-- 호버 시 추가 정보 표시 -->
+<td title="메타정보: ${metadata}" style="cursor: help;">
+    ${name}
+</td>
+```
+
+#### 2. 동적 옵션 생성
+```javascript
+function populateDropdown(selectId, options) {
+    const select = document.getElementById(selectId);
+    select.innerHTML = '<option value="">-- 선택 --</option>' +
+        options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
+}
+```
+
+#### 3. 상태 표시
+```javascript
+function renderStatusBadge(status) {
+    const statusMap = {
+        'available': { text: '사용가능', class: 'status-success' },
+        'maintenance': { text: '점검중', class: 'status-warning' },
+        'broken': { text: '고장', class: 'status-error' }
+    };
+
+    const { text, class: className } = statusMap[status];
+    return `<span class="${className}">${text}</span>`;
+}
+```
+
+### 디버깅 체크리스트
+
+개발 중 콘솔에서 확인해야 할 로그:
+1. ✅ 자원 로드: `console.log('자원 목록:', resourceList.length)`
+2. ✅ 카테고리 추출: `console.log('카테고리:', JSON.stringify(CATEGORIES))`
+3. ✅ 드롭다운 업데이트: `console.log('드롭다운 생성:', CATEGORIES.length + '개')`
+4. ✅ 매칭 결과: `console.log('카테고리 매칭:', resource.id, resource.name)`
+5. ✅ 업로드 결과: `console.log('성공/실패:', successCount, errorCount)`
+
+---
+
+## 디버깅 코드 필수 규칙
+
+코드 작성 시 **반드시** 디버깅용 로그를 포함해야 합니다.
+
+### 필수 디버깅 패턴
+
+#### 1. API 호출 시
+```javascript
+// API 호출 전 - 전송 데이터 출력
+console.log('API 요청 데이터:', JSON.stringify(requestData, null, 2));
+
+// API 호출 후 - 에러 상세 출력
+if (error) {
+    console.error('API 에러:', JSON.stringify(error, null, 2));
+}
+```
+
+#### 2. 중요 함수 진입 시
+```javascript
+function importantFunction(param1, param2) {
+    console.log('함수 진입:', { param1, param2 });
+    // ... 로직
+}
+```
+
+#### 3. 조건 분기 시
+```javascript
+if (condition) {
+    console.log('분기: condition true');
+} else {
+    console.log('분기: condition false');
+}
+```
+
+### 적용 범위
+- 모든 API 호출 (Supabase, fetch, axios 등)
+- 데이터 변환/처리 함수
+- 이벤트 핸들러
+- 상태 변경 로직
+
+---
+
+## PR 생성 규칙
+
+PR(Pull Request)을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.
+
+예시:
+```
+PR이 생성되었습니다: https://github.com/owner/repo/pull/123
+```
+
+이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.

commit a4e7fb7d4c0fe3994ed739abbd97c2ee7902094f
Author: Claude <noreply@anthropic.com>
Date:   Wed Jan 21 04:20:01 2026 +0000

    Add arrange button and flatten UI design
    
    Changes:
    1. Flatten background (remove gradients)
       - body: solid var(--primary-main)
       - board: solid var(--primary-main)
    
    2. Brighten FAB buttons
       - Add note button: #4FC3DC (brighter cyan)
       - New arrange button: #5AD3EC (lighter cyan)
    
    3. Add arrange button
       - Position: left of add button (right: 104px)
       - Icon: ⊞ (arrange symbol)
       - Function: repositionNotesInViewport()
       - Toast feedback on click
    
    UI is now flat and modern with brighter, more visible buttons.
    
    Service Worker: v9 → v10

diff --git a/CLAUDE.md b/CLAUDE.md
new file mode 100644
index 0000000..683f200
--- /dev/null
+++ b/CLAUDE.md
@@ -0,0 +1,370 @@
+# Claude Code Instructions
+
+## 웹앱 UI/UX 디자인 가이드
+
+웹앱을 만들거나 수정할 때 **반드시** `docs/DESIGN_SYSTEM.md` 파일의 디자인 가이드를 참조해야 합니다.
+
+### 핵심 원칙
+- **색상**: DMRT 스타일 기반 (`--primary-dark: #0c3026`, `--primary-main: #017f97`)
+- **간격**: 8px 기반 시스템
+- **타이포그래피**: KoPub Dotum 폰트
+- **반응형**: Mobile First 접근법
+- **접근성**: WCAG 2.1 AA 준수 (색상 대비 4.5:1 이상)
+- **터치 타겟**: 최소 44px
+
+### 필수 확인 사항
+1. 버튼, 입력 필드, 카드 등 컴포넌트 스타일 준수
+2. 상태별 디자인 (hover, focus, error, disabled)
+3. 모달, 토스트, 알림 등 피드백 시스템 일관성
+4. 반응형 브레이크포인트 적용
+
+---
+
+## 예약 시스템 템플릿 가이드
+
+현재 구현된 예약 시스템의 구조와 흐름을 다른 예약 시스템 개발 시 템플릿으로 활용할 수 있습니다.
+
+### 시스템 구조 개요
+
+```
+[인증 레이어]
+    ↓
+[자원 관리] ←→ [카테고리 동적 로딩]
+    ↓
+[예약 폼] → [시간대 선택] → [장바구니]
+    ↓
+[예약 제출] → [승인 워크플로우] → [예약 확정]
+```
+
+### 핵심 컴포넌트
+
+#### 1. 데이터 모델 설계
+```javascript
+// 자원 엔티티 (예: 장비, 회의실, 차량 등)
+{
+    id: 'UUID',
+    name: '자원명',
+    primary_category: '주 카테고리',      // 필수: 그룹핑 기준
+    secondary_location: '부 위치',         // 선택: 추가 위치 정보
+    metadata_field: '메타데이터',          // 선택: 추가 식별 정보
+    status: 'available/maintenance/broken',
+    approval_mode: 'auto/manual'
+}
+
+// 예약 엔티티
+{
+    resource_id: 'FK to 자원',
+    user_id: 'FK to 사용자',
+    category: '카테고리명',
+    start_time: 'timestamp',
+    end_time: 'timestamp',
+    purpose: '예약 목적',
+    status: 'pending/approved/rejected'
+}
+```
+
+#### 2. 동적 카테고리 로딩 패턴
+```javascript
+// 1. 자원 로드 시 카테고리 자동 추출
+async function loadResources() {
+    const { data } = await fetchResources();
+    resourceList = data;
+
+    // 주요 카테고리 추출
+    const categories = [...new Set(data
+        .map(r => r.primary_category)
+        .filter(c => c && c.trim() !== '')
+    )];
+
+    CATEGORIES = categories;
+    updateCategoryDropdowns(); // 모든 드롭다운 업데이트
+}
+
+// 2. 카테고리 드롭다운 업데이트
+function updateCategoryDropdowns() {
+    // 예약 폼, 필터, 검색 등 모든 드롭다운 업데이트
+    populateDropdown('categorySelect', CATEGORIES);
+}
+```
+
+#### 3. Excel 업로드/다운로드 패턴
+```javascript
+// 업로드: 필수 필드 검증 + 중복 체크
+async function handleExcelUpload(file) {
+    const jsonData = parseExcel(file);
+
+    for (const row of jsonData) {
+        const data = {
+            name: row['필수필드1'],                    // 필수
+            primary_category: row['필수필드2'],        // 필수
+            optional_field: row['선택필드(선택)'] || null  // 선택
+        };
+
+        // 필수 필드 검증
+        if (!data.name || !data.primary_category) {
+            errorList.push({ name: data.name, reason: '필수 필드 누락' });
+            continue;
+        }
+
+        // 중복 체크 (이름 + 카테고리 조합)
+        const { data: duplicates } = await checkDuplicate(data.name, data.primary_category);
+        if (duplicates.length > 0) {
+            errorList.push({ name: data.name, reason: '중복 자원' });
+            continue;
+        }
+
+        // 데이터 삽입
+        await insertResource(data);
+    }
+
+    // 결과 로그
+    console.log('업로드 결과:', { successCount, errorCount });
+    console.log('실패 목록:', JSON.stringify(errorList, null, 2));
+}
+
+// 다운로드: 업로드된 데이터 그대로 유지
+function exportToExcel() {
+    const exportData = resourceList.map(r => ({
+        '필수필드1': r.name,
+        '필수필드2': r.primary_category,
+        '선택필드(선택)': r.optional_field || ''
+    }));
+
+    downloadExcel(exportData);
+}
+```
+
+#### 4. 예약 흐름 구현
+```javascript
+// Step 1: 카테고리 선택
+onCategorySelect() {
+    // 선택한 카테고리에 해당하는 자원 필터링
+    filteredResources = resourceList.filter(r => r.primary_category === selectedCategory);
+    renderResourceGrid(filteredResources);
+}
+
+// Step 2: 날짜/시간 선택
+onDateSelect() {
+    loadAvailableTimeSlots(selectedResource, selectedDate);
+}
+
+// Step 3: 장바구니 추가
+addToCart() {
+    cartItems.push({
+        resource_id: selectedResource.id,
+        category: selectedCategory,
+        date: selectedDate,
+        timeSlots: selectedTimeSlots
+    });
+}
+
+// Step 4: 일괄 예약 제출
+async submitReservations() {
+    for (const item of cartItems) {
+        const reservation = {
+            resource_id: findResourceByCategory(item.category),
+            start_time: combineDateTime(item.date, item.startTime),
+            end_time: combineDateTime(item.date, item.endTime),
+            status: getApprovalMode() === 'auto' ? 'approved' : 'pending'
+        };
+
+        await insertReservation(reservation);
+    }
+}
+```
+
+#### 5. 자원-카테고리 매칭 패턴
+```javascript
+// 카테고리명으로 자원 ID 찾기
+function findResourceByCategory(categoryName) {
+    // 1순위: 주 카테고리 매칭
+    let resource = resourceList.find(r => r.primary_category === categoryName);
+    if (resource) return resource.id;
+
+    // 2순위: 부 위치 매칭 (하위 호환성)
+    resource = resourceList.find(r => r.secondary_location === categoryName);
+    if (resource) return resource.id;
+
+    // Fallback: 첫 번째 자원
+    return resourceList[0]?.id;
+}
+```
+
+### 사용자 역할별 기능
+
+#### 일반 사용자
+- 자원 검색 및 예약
+- 내 예약 조회/취소
+- 자원 등록 신청 (승인 대기)
+
+#### 관리자
+- 모든 예약 조회/관리
+- 예약 승인/거부
+- 자원 CRUD
+- 사용자 관리
+- Excel 일괄 업로드/다운로드
+
+### 필수 구현 사항
+
+#### 1. 상태 관리
+```javascript
+// 전역 상태
+let resourceList = [];          // 자원 목록
+let CATEGORIES = [];            // 카테고리 목록 (동적 추출)
+let selectedCategory = null;    // 현재 선택된 카테고리
+let cartItems = [];             // 장바구니
+```
+
+#### 2. 동기화 포인트
+```javascript
+// 자원 로드 시 모든 관련 UI 업데이트
+async function loadResources() {
+    await fetchData();
+    updateCategories();          // 카테고리 추출
+    updateAllDropdowns();        // 모든 드롭다운 동기화
+    renderResourceGrid();        // 자원 그리드 렌더링
+}
+```
+
+#### 3. 검증 레이어
+```javascript
+// 필수 필드 검증
+function validateRequired(data, requiredFields) {
+    for (const field of requiredFields) {
+        if (!data[field]) {
+            return { valid: false, message: `${field} 필드 누락` };
+        }
+    }
+    return { valid: true };
+}
+
+// 중복 검증
+async function checkDuplicate(identifier1, identifier2) {
+    const { data } = await db
+        .select('id')
+        .eq('field1', identifier1)
+        .eq('field2', identifier2);
+
+    return data.length > 0;
+}
+```
+
+#### 4. 에러 처리
+```javascript
+// 일괄 작업 시 에러 수집
+const successList = [];
+const errorList = [];
+
+for (const item of items) {
+    try {
+        await processItem(item);
+        successList.push(item.name);
+    } catch (error) {
+        errorList.push({
+            name: item.name,
+            reason: error.message
+        });
+    }
+}
+
+// 결과 로그 출력
+console.log('성공:', JSON.stringify(successList, null, 2));
+console.log('실패:', JSON.stringify(errorList, null, 2));
+```
+
+### UI 상호작용 패턴
+
+#### 1. Tooltip 표시
+```html
+<!-- 호버 시 추가 정보 표시 -->
+<td title="메타정보: ${metadata}" style="cursor: help;">
+    ${name}
+</td>
+```
+
+#### 2. 동적 옵션 생성
+```javascript
+function populateDropdown(selectId, options) {
+    const select = document.getElementById(selectId);
+    select.innerHTML = '<option value="">-- 선택 --</option>' +
+        options.map(opt => `<option value="${opt}">${opt}</option>`).join('');
+}
+```
+
+#### 3. 상태 표시
+```javascript
+function renderStatusBadge(status) {
+    const statusMap = {
+        'available': { text: '사용가능', class: 'status-success' },
+        'maintenance': { text: '점검중', class: 'status-warning' },
+        'broken': { text: '고장', class: 'status-error' }
+    };
+
+    const { text, class: className } = statusMap[status];
+    return `<span class="${className}">${text}</span>`;
+}
+```
+
+### 디버깅 체크리스트
+
+개발 중 콘솔에서 확인해야 할 로그:
+1. ✅ 자원 로드: `console.log('자원 목록:', resourceList.length)`
+2. ✅ 카테고리 추출: `console.log('카테고리:', JSON.stringify(CATEGORIES))`
+3. ✅ 드롭다운 업데이트: `console.log('드롭다운 생성:', CATEGORIES.length + '개')`
+4. ✅ 매칭 결과: `console.log('카테고리 매칭:', resource.id, resource.name)`
+5. ✅ 업로드 결과: `console.log('성공/실패:', successCount, errorCount)`
+
+---
+
+## 디버깅 코드 필수 규칙
+
+코드 작성 시 **반드시** 디버깅용 로그를 포함해야 합니다.
+
+### 필수 디버깅 패턴
+
+#### 1. API 호출 시
+```javascript
+// API 호출 전 - 전송 데이터 출력
+console.log('API 요청 데이터:', JSON.stringify(requestData, null, 2));
+
+// API 호출 후 - 에러 상세 출력
+if (error) {
+    console.error('API 에러:', JSON.stringify(error, null, 2));
+}
+```
+
+#### 2. 중요 함수 진입 시
+```javascript
+function importantFunction(param1, param2) {
+    console.log('함수 진입:', { param1, param2 });
+    // ... 로직
+}
+```
+
+#### 3. 조건 분기 시
+```javascript
+if (condition) {
+    console.log('분기: condition true');
+} else {
+    console.log('분기: condition false');
+}
+```
+
+### 적용 범위
+- 모든 API 호출 (Supabase, fetch, axios 등)
+- 데이터 변환/처리 함수
+- 이벤트 핸들러
+- 상태 변경 로직
+
+---
+
+## PR 생성 규칙
+
+PR(Pull Request)을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.
+
+예시:
+```
+PR이 생성되었습니다: https://github.com/owner/repo/pull/123
+```
+
+이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.
