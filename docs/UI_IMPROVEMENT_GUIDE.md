# UI 개선 가이드

이 문서는 기존 웹 앱들을 DESIGN_SYSTEM.md 표준에 맞게 개선하기 위한 가이드입니다.

---

## 1. 현황 요약

### 1.1 CSS 변수 사용 패턴별 분류

| 분류 | 앱 | 개선 필요도 |
|------|-----|-----------|
| **✅ 완전 준수** | molecular_marker_designer, data_format_converter | 없음 |
| **🔷 부분 준수** | index, field_environment, rapdb_browser, gene_database, data_sharing, image_phenotyping | 낮음 |
| **🔶 레거시 변수** | createphenotypingform, DMRT_분석기 | 중간 |
| **🔷 DMRT 프리픽스** | rice_breeding, presentation_system | 낮음 |
| **🔴 개별 스타일** | kasp, gel_analyzer, kasp_multi_gene, HRMguide, HRMguideslide | 높음 |

---

## 2. 우선순위별 개선 목록

### 2.1 높은 우선순위 (메인 도구)

#### 1. `kasp.html` - KASP 분석기
**현재 상태:**
- 자체 CSS 변수 체계 (--primary-dark, --primary, --primary-light)
- 색상값은 표준과 일치하나 변수명 불일치
- 토스트 알림 미적용

**개선 항목:**
- [ ] CSS 변수명을 표준으로 통일
- [ ] 토스트 알림 시스템 추가
- [ ] 폼 요소 상태 스타일 (focus, error) 강화
- [ ] 접근성 속성 (ARIA) 추가

#### 2. `gel_analyzer.html` - Gel 이미지 분석기
**현재 상태:**
- kasp.html과 유사한 변수 체계
- 파일 업로드 영역 스타일 개선 필요

**개선 항목:**
- [ ] CSS 변수명 표준화
- [ ] 파일 드래그앤드롭 영역 UI 개선
- [ ] 로딩 상태 표시 강화
- [ ] 결과 테이블 스타일 통일

#### 3. `createphenotypingform.html` - 표현형 조사
**현재 상태:**
- 레거시 변수 사용 (--accent-1~7)
- 대규모 앱 (389K)

**개선 항목:**
- [ ] --accent-* → 표준 변수 매핑
- [ ] 탭 네비게이션 스타일 표준화
- [ ] 모달 스타일 통일
- [ ] 인쇄 스타일 개선

### 2.2 중간 우선순위

#### 4. `DMRT_분석기_v4_6.html`
- [ ] --accent-* → 표준 변수 매핑
- [ ] 차트 영역 반응형 개선

#### 5. `HRMguide.html` & `HRMguideslide.html`
- [ ] 변수명 표준화
- [ ] 슬라이드 네비게이션 UI 개선

#### 6. `kasp_multi_gene_analyzer.html`
- [ ] kasp.html과 통일된 스타일 적용

### 2.3 낮은 우선순위

#### 7. `index.html` (메인 포털)
- 현재 잘 동작하며, 스타일도 일관성 있음
- 변수명만 표준화하면 됨
- [ ] --primary → --primary-dark 매핑
- [ ] --secondary → --primary-main 매핑

#### 8. 기타 앱들
- field_environment, rapdb_browser, gene_database, data_sharing, image_phenotyping
- 대부분 표준과 유사하므로 점진적 개선

---

## 3. 개선 작업 가이드

### 3.1 CSS 변수 마이그레이션

레거시 변수를 사용하는 앱은 다음과 같이 호환성 매핑을 추가:

```css
:root {
    /* 새 표준 변수 */
    --primary-dark: #0c3026;
    --primary-main: #017f97;
    --primary-light: #e8f4f8;

    /* 레거시 호환성 (기존 코드 지원) */
    --accent-7: var(--primary-dark);
    --accent-6: var(--primary-main);
    --primary: var(--primary-dark);
    --secondary: var(--primary-main);
}
```

### 3.2 토스트 알림 추가

기존 `alert()` 사용 코드를 토스트로 교체:

```javascript
// 기존 코드
alert('저장되었습니다.');

// 개선된 코드
showToast('저장되었습니다.', 'success');
```

토스트 시스템 HTML:
```html
<div class="toast-container" id="toastContainer"></div>
```

토스트 함수:
```javascript
function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span>${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), duration);
}
```

### 3.3 폼 요소 개선

표준 폼 클래스 적용:
```html
<div class="form-group">
    <label for="input1" class="form-label">
        레이블 <span class="required">*</span>
    </label>
    <input type="text" id="input1" class="form-input" placeholder="예: 값">
    <p class="form-hint">도움말</p>
    <p class="form-error">오류 메시지</p>
</div>
```

### 3.4 접근성 개선

필수 ARIA 속성:
```html
<!-- 탭 -->
<div class="tabs" role="tablist">
    <button class="tab" role="tab" aria-selected="true" aria-controls="panel1">탭 1</button>
</div>
<div id="panel1" role="tabpanel" aria-labelledby="tab1">내용</div>

<!-- 모달 -->
<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
    <h2 id="modalTitle">제목</h2>
</div>

<!-- 알림 -->
<div role="alert" aria-live="polite">메시지</div>
```

---

## 4. 체크리스트

### 개선 시 확인 사항

- [ ] CSS 변수가 표준과 일치하는가?
- [ ] 모든 입력 필드에 레이블이 있는가?
- [ ] 포커스 상태가 명확하게 표시되는가?
- [ ] 터치 타겟이 최소 44px인가?
- [ ] 모바일에서 정상 동작하는가?
- [ ] 토스트 알림을 사용하는가? (alert 대신)
- [ ] ARIA 속성이 적용되어 있는가?
- [ ] 로딩 상태가 표시되는가?
- [ ] 빈 상태(Empty State)가 처리되어 있는가?

---

## 5. 참고 자료

- **디자인 시스템**: `docs/DESIGN_SYSTEM.md`
- **표준 CSS 변수**: `shared/css-variables.css`
- **앱 템플릿**: `shared/app-template.html`

---

## 6. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2024-12-24 | 1.0 | 초기 문서 작성 |
