# Claude Code용 종합 UI/UX 디자인 가이드

솜여님의 DMRT 스타일 기반과 실무 베스트 프랙티스를 통합한 체계적인 디자인 시스템입니다.

---

## 1. 디자인 시스템 기초

### 1.1 색상 체계
```css
/* 주요 색상 (DMRT 스타일 기반) */
--primary-dark: #0c3026;      /* 헤더, 주요 버튼 */
--primary-main: #017f97;      /* 액센트, 링크 */
--primary-light: #e8f4f8;     /* 배경 강조 */

/* 배경 색상 */
--bg-page: #ffffff;           /* 페이지 배경 */
--bg-card: #f8f9fa;           /* 카드 배경 */
--bg-input: #ffffff;          /* 입력필드 배경 */

/* 텍스트 색상 */
--text-primary: #212529;      /* 본문 */
--text-secondary: #6c757d;    /* 보조 텍스트 */
--text-placeholder: #adb5bd;  /* 플레이스홀더 */
--text-disabled: #ced4da;     /* 비활성 */

/* 상태 색상 */
--success: #28a745;
--warning: #ffc107;
--error: #dc3545;
--info: #17a2b8;

/* 테두리 */
--border-default: #dee2e6;
--border-focus: #017f97;
--border-error: #dc3545;
```

### 1.2 타이포그래피
```css
/* 폰트 패밀리 */
--font-primary: 'KoPub Dotum', 'Malgun Gothic', sans-serif;
--font-code: 'D2Coding', 'Consolas', monospace;

/* 폰트 크기 체계 */
--text-xs: 0.75rem;    /* 12px - 캡션, 각주 */
--text-sm: 0.875rem;   /* 14px - 보조 텍스트 */
--text-base: 1rem;     /* 16px - 본문 기본 */
--text-lg: 1.125rem;   /* 18px - 강조 본문 */
--text-xl: 1.25rem;    /* 20px - 소제목 */
--text-2xl: 1.5rem;    /* 24px - 섹션 제목 */
--text-3xl: 1.875rem;  /* 30px - 페이지 제목 */

/* 폰트 굵기 */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-bold: 700;

/* 줄 높이 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 1.3 간격 시스템 (8px 기반)
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

---

## 2. 레이아웃 구조

### 2.1 페이지 구조
```
┌─────────────────────────────────────────────────┐
│  Header (고정, 높이 60-80px)                      │
│  - 로고(좌측) / 메인메뉴(중앙) / 유틸리티(우측)     │
├─────────────────────────────────────────────────┤
│  Breadcrumb (선택적, 높이 40px)                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  Main Content                                   │
│  - 최대 너비: 1200px (데스크톱)                   │
│  - 좌우 패딩: 16px (모바일) / 24px (태블릿) /     │
│              32px (데스크톱)                     │
│                                                 │
├─────────────────────────────────────────────────┤
│  Footer (높이 자동)                              │
│  - 저작권, 링크, 연락처                           │
└─────────────────────────────────────────────────┘
```

### 2.2 그리드 시스템
```css
/* 12컬럼 그리드 */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 var(--space-4);
}

/* 반응형 브레이크포인트 */
--breakpoint-sm: 576px;   /* 모바일 가로 */
--breakpoint-md: 768px;   /* 태블릿 */
--breakpoint-lg: 992px;   /* 데스크톱 */
--breakpoint-xl: 1200px;  /* 대형 데스크톱 */
```

### 2.3 카드 컴포넌트
```css
.card {
    background: var(--bg-card);
    border: 1px solid var(--border-default);
    border-radius: 8px;
    padding: var(--space-6);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.2s ease;
}

.card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
```

---

## 3. 입력 필드 (Form Elements)

### 3.1 텍스트 입력 필드 상태별 디자인

#### 기본 구조
```html
<div class="form-group">
    <label for="fieldId" class="form-label">
        레이블 텍스트
        <span class="required">*</span>
    </label>
    <div class="input-wrapper">
        <input type="text"
               id="fieldId"
               class="form-input"
               placeholder="예: 홍길동">
        <span class="input-icon"></span>
    </div>
    <p class="form-hint">안내 메시지 (선택적)</p>
    <p class="form-error">오류 메시지</p>
</div>
```

#### 상태별 스타일
```css
/* 기본 상태 */
.form-input {
    width: 100%;
    height: 44px;  /* 최소 터치 타겟 */
    padding: var(--space-3) var(--space-4);
    font-size: var(--text-base);
    color: var(--text-primary);
    background: var(--bg-input);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    transition: all 0.2s ease;
}

/* 플레이스홀더 */
.form-input::placeholder {
    color: var(--text-placeholder);
    font-style: italic;
}

/* 포커스 상태 */
.form-input:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(1, 127, 151, 0.15);
}

/* 성공 상태 */
.form-input.is-valid {
    border-color: var(--success);
    padding-right: 40px;  /* 아이콘 공간 */
}

/* 오류 상태 */
.form-input.is-invalid {
    border-color: var(--error);
    background: #fff5f5;
}

/* 비활성 상태 */
.form-input:disabled {
    background: #f1f3f4;
    color: var(--text-disabled);
    cursor: not-allowed;
}

/* 읽기 전용 */
.form-input:read-only {
    background: #f8f9fa;
    border-style: dashed;
}
```

### 3.2 레이블과 플레이스홀더 원칙

| 요소 | 용도 | 규칙 |
|------|------|------|
| **레이블** | 필드 식별 | 항상 표시, 숨기지 않음 |
| **플레이스홀더** | 입력 예시/힌트 | 레이블 대체 금지, 보조용으로만 |
| **힌트 텍스트** | 상세 안내 | 필드 아래 배치, 항상 표시 |
| **오류 메시지** | 유효성 피드백 | 실시간 또는 제출 시 표시 |

```css
/* 레이블 */
.form-label {
    display: block;
    margin-bottom: var(--space-2);
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--text-primary);
}

/* 필수 표시 */
.required {
    color: var(--error);
    margin-left: 2px;
}

/* 힌트 텍스트 */
.form-hint {
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--text-secondary);
}

/* 오류 메시지 */
.form-error {
    margin-top: var(--space-1);
    font-size: var(--text-xs);
    color: var(--error);
    display: none;
}

.form-input.is-invalid + .form-error {
    display: block;
}
```

### 3.3 특수 입력 필드

#### 검색 필드
```css
.search-input {
    padding-left: 40px;  /* 돋보기 아이콘 공간 */
    padding-right: 40px; /* 삭제 버튼 공간 */
}

.search-wrapper {
    position: relative;
}

.search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-placeholder);
}

.search-clear {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s;
}

.search-input:not(:placeholder-shown) + .search-clear {
    opacity: 1;
}
```

#### 비밀번호 필드
```html
<div class="password-wrapper">
    <input type="password" class="form-input" id="password">
    <button type="button" class="toggle-password" aria-label="비밀번호 표시">
        <svg class="icon-eye">...</svg>
        <svg class="icon-eye-off" style="display:none">...</svg>
    </button>
</div>
```

#### 파일 업로드
```css
.file-upload {
    border: 2px dashed var(--border-default);
    border-radius: 8px;
    padding: var(--space-8);
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.file-upload:hover,
.file-upload.drag-over {
    border-color: var(--primary-main);
    background: var(--primary-light);
}
```

### 3.4 셀렉트 박스 및 드롭다운
```css
.form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,..."); /* 화살표 아이콘 */
    background-repeat: no-repeat;
    background-position: right 12px center;
    padding-right: 40px;
}

/* 커스텀 드롭다운 */
.dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    max-height: 300px;
    overflow-y: auto;
    background: white;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
}

.dropdown-item {
    padding: var(--space-3) var(--space-4);
    cursor: pointer;
    transition: background 0.15s;
}

.dropdown-item:hover {
    background: var(--primary-light);
}

.dropdown-item.selected {
    background: var(--primary-main);
    color: white;
}
```

---

## 4. 버튼 시스템

### 4.1 버튼 계층 구조
```
Primary (주요 액션) > Secondary (보조 액션) > Tertiary (추가 옵션) > Ghost (최소 강조)
```

### 4.2 버튼 스타일
```css
/* 기본 버튼 */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-height: 44px;  /* 접근성: 터치 타겟 */
    padding: var(--space-3) var(--space-6);
    font-size: var(--text-base);
    font-weight: var(--font-medium);
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

/* Primary 버튼 */
.btn-primary {
    background: var(--primary-dark);
    color: white;
}

.btn-primary:hover {
    background: #0a2820;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(12, 48, 38, 0.3);
}

.btn-primary:active {
    transform: translateY(0);
}

/* Secondary 버튼 */
.btn-secondary {
    background: var(--primary-main);
    color: white;
}

/* Outline 버튼 */
.btn-outline {
    background: transparent;
    border: 1px solid var(--primary-main);
    color: var(--primary-main);
}

.btn-outline:hover {
    background: var(--primary-light);
}

/* Ghost 버튼 */
.btn-ghost {
    background: transparent;
    color: var(--primary-main);
}

.btn-ghost:hover {
    background: rgba(1, 127, 151, 0.1);
}

/* 위험 버튼 */
.btn-danger {
    background: var(--error);
    color: white;
}

/* 버튼 크기 */
.btn-sm {
    min-height: 36px;
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
}

.btn-lg {
    min-height: 52px;
    padding: var(--space-4) var(--space-8);
    font-size: var(--text-lg);
}

/* 전체 너비 */
.btn-block {
    width: 100%;
}

/* 비활성 상태 */
.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
}

/* 로딩 상태 */
.btn.is-loading {
    pointer-events: none;
    position: relative;
    color: transparent;
}

.btn.is-loading::after {
    content: "";
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
```

### 4.3 버튼 그룹
```css
.btn-group {
    display: flex;
    gap: var(--space-2);
}

.btn-group-connected .btn {
    border-radius: 0;
}

.btn-group-connected .btn:first-child {
    border-radius: 6px 0 0 6px;
}

.btn-group-connected .btn:last-child {
    border-radius: 0 6px 6px 0;
}
```

---

## 5. 네비게이션 및 메뉴

### 5.1 헤더 네비게이션
```css
.header {
    position: sticky;
    top: 0;
    height: 64px;
    background: var(--primary-dark);
    color: white;
    display: flex;
    align-items: center;
    padding: 0 var(--space-6);
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-menu {
    display: flex;
    gap: var(--space-1);
    list-style: none;
    margin: 0;
    padding: 0;
}

.nav-item {
    position: relative;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    border-radius: 4px;
    transition: all 0.2s;
}

.nav-link:hover,
.nav-link.active {
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

/* 드롭다운 표시 아이콘 */
.nav-link.has-dropdown::after {
    content: "▼";
    font-size: 10px;
    margin-left: var(--space-1);
    transition: transform 0.2s;
}

.nav-item:hover .nav-link.has-dropdown::after {
    transform: rotate(180deg);
}
```

### 5.2 사이드바 네비게이션
```css
.sidebar {
    width: 260px;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 64px;  /* 헤더 높이 */
    background: #f8f9fa;
    border-right: 1px solid var(--border-default);
    overflow-y: auto;
    padding: var(--space-4) 0;
}

.sidebar-section {
    margin-bottom: var(--space-6);
}

.sidebar-title {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-xs);
    font-weight: var(--font-bold);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.sidebar-link {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    color: var(--text-primary);
    text-decoration: none;
    transition: all 0.15s;
}

.sidebar-link:hover {
    background: rgba(1, 127, 151, 0.1);
}

.sidebar-link.active {
    background: var(--primary-light);
    color: var(--primary-main);
    border-right: 3px solid var(--primary-main);
}
```

### 5.3 탭 네비게이션
```css
.tabs {
    display: flex;
    border-bottom: 1px solid var(--border-default);
    gap: var(--space-1);
}

.tab {
    padding: var(--space-3) var(--space-5);
    color: var(--text-secondary);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    font-size: var(--text-base);
}

.tab:hover {
    color: var(--primary-main);
}

.tab.active {
    color: var(--primary-main);
    border-bottom-color: var(--primary-main);
    font-weight: var(--font-medium);
}

.tab-content {
    padding: var(--space-6) 0;
}

.tab-panel {
    display: none;
}

.tab-panel.active {
    display: block;
    animation: fadeIn 0.3s ease;
}
```

### 5.4 브레드크럼
```css
.breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3) 0;
    font-size: var(--text-sm);
}

.breadcrumb-item {
    color: var(--text-secondary);
}

.breadcrumb-item a {
    color: var(--primary-main);
    text-decoration: none;
}

.breadcrumb-item a:hover {
    text-decoration: underline;
}

.breadcrumb-separator {
    color: var(--text-placeholder);
}

.breadcrumb-item.current {
    color: var(--text-primary);
    font-weight: var(--font-medium);
}
```

### 5.5 모바일 네비게이션 (햄버거 메뉴)
```css
.mobile-menu-toggle {
    display: none;
    width: 44px;
    height: 44px;
    background: none;
    border: none;
    cursor: pointer;
}

@media (max-width: 768px) {
    .mobile-menu-toggle {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
    }

    .mobile-menu-toggle span {
        display: block;
        width: 24px;
        height: 2px;
        background: white;
        transition: all 0.3s;
    }

    .mobile-menu-toggle.open span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .mobile-menu-toggle.open span:nth-child(2) {
        opacity: 0;
    }

    .mobile-menu-toggle.open span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
    }

    .nav-menu {
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        background: var(--primary-dark);
        flex-direction: column;
        padding: var(--space-4);
        transform: translateX(-100%);
        transition: transform 0.3s ease;
    }

    .nav-menu.open {
        transform: translateX(0);
    }
}
```

---

## 6. 피드백 시스템

### 6.1 토스트 알림
```css
.toast-container {
    position: fixed;
    top: var(--space-4);
    right: var(--space-4);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.toast {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    min-width: 300px;
    max-width: 450px;
    padding: var(--space-4);
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    animation: slideIn 0.3s ease;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.toast-success {
    border-left: 4px solid var(--success);
}

.toast-error {
    border-left: 4px solid var(--error);
}

.toast-warning {
    border-left: 4px solid var(--warning);
}

.toast-info {
    border-left: 4px solid var(--info);
}

.toast-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
}

.toast-close:hover {
    opacity: 1;
}
```

### 6.2 인라인 알림 (Alert)
```css
.alert {
    display: flex;
    align-items: flex-start;
    gap: var(--space-3);
    padding: var(--space-4);
    border-radius: 6px;
    margin-bottom: var(--space-4);
}

.alert-success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
}

.alert-error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
}

.alert-warning {
    background: #fff3cd;
    color: #856404;
    border: 1px solid #ffeeba;
}

.alert-info {
    background: #d1ecf1;
    color: #0c5460;
    border: 1px solid #bee5eb;
}
```

### 6.3 진행률 표시
```css
/* 프로그레스 바 */
.progress {
    height: 8px;
    background: #e9ecef;
    border-radius: 4px;
    overflow: hidden;
}

.progress-bar {
    height: 100%;
    background: var(--primary-main);
    transition: width 0.3s ease;
}

/* 원형 프로그레스 */
.progress-circle {
    width: 60px;
    height: 60px;
    transform: rotate(-90deg);
}

.progress-circle-bg {
    fill: none;
    stroke: #e9ecef;
    stroke-width: 6;
}

.progress-circle-fill {
    fill: none;
    stroke: var(--primary-main);
    stroke-width: 6;
    stroke-linecap: round;
    stroke-dasharray: 157;  /* 2 * π * 25 */
    stroke-dashoffset: 157;
    transition: stroke-dashoffset 0.5s ease;
}
```

### 6.4 스켈레톤 로딩
```css
.skeleton {
    background: linear-gradient(
        90deg,
        #f0f0f0 25%,
        #e0e0e0 50%,
        #f0f0f0 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 4px;
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

.skeleton-text {
    height: 16px;
    margin-bottom: 8px;
}

.skeleton-text:last-child {
    width: 60%;
}

.skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
}

.skeleton-image {
    width: 100%;
    height: 200px;
}
```

### 6.5 Empty State
```css
.empty-state {
    text-align: center;
    padding: var(--space-16) var(--space-6);
}

.empty-state-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto var(--space-6);
    color: var(--text-placeholder);
}

.empty-state-title {
    font-size: var(--text-xl);
    font-weight: var(--font-medium);
    color: var(--text-primary);
    margin-bottom: var(--space-2);
}

.empty-state-description {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}
```

---

## 7. 모달 및 팝업

### 7.1 모달
```css
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
}

.modal-overlay.open {
    opacity: 1;
    visibility: visible;
}

.modal {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 500px;
    max-height: 90vh;
    overflow: hidden;
    transform: scale(0.9);
    transition: transform 0.3s ease;
}

.modal-overlay.open .modal {
    transform: scale(1);
}

.modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4) var(--space-6);
    border-bottom: 1px solid var(--border-default);
}

.modal-title {
    font-size: var(--text-xl);
    font-weight: var(--font-medium);
    margin: 0;
}

.modal-close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
}

.modal-close:hover {
    background: #f1f3f4;
}

.modal-body {
    padding: var(--space-6);
    overflow-y: auto;
    max-height: 60vh;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-3);
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--border-default);
    background: #f8f9fa;
}

/* 모달 크기 변형 */
.modal-sm { max-width: 350px; }
.modal-lg { max-width: 700px; }
.modal-xl { max-width: 900px; }
.modal-fullscreen {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    border-radius: 0;
}
```

### 7.2 확인 다이얼로그
```css
.dialog {
    text-align: center;
}

.dialog-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto var(--space-4);
}

.dialog-icon.warning {
    color: var(--warning);
}

.dialog-icon.danger {
    color: var(--error);
}

.dialog-message {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-6);
}
```

### 7.3 툴팁
```css
.tooltip-wrapper {
    position: relative;
    display: inline-block;
}

.tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(-8px);
    padding: var(--space-2) var(--space-3);
    background: #333;
    color: white;
    font-size: var(--text-xs);
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
    z-index: 1000;
}

.tooltip::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: #333;
}

.tooltip-wrapper:hover .tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateX(-50%) translateY(-4px);
}

/* 툴팁 위치 변형 */
.tooltip.bottom {
    bottom: auto;
    top: 100%;
    transform: translateX(-50%) translateY(8px);
}

.tooltip.bottom::after {
    top: auto;
    bottom: 100%;
    border-top-color: transparent;
    border-bottom-color: #333;
}
```

---

## 8. 테이블 및 데이터 표시

### 8.1 기본 테이블
```css
.table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border-default);
    border-radius: 8px;
}

.table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
}

.table th,
.table td {
    padding: var(--space-3) var(--space-4);
    text-align: left;
    border-bottom: 1px solid var(--border-default);
}

.table th {
    background: #f8f9fa;
    font-weight: var(--font-medium);
    color: var(--text-secondary);
    white-space: nowrap;
}

.table tbody tr:hover {
    background: #f8f9fa;
}

.table tbody tr:last-child td {
    border-bottom: none;
}

/* 정렬 가능한 헤더 */
.table th.sortable {
    cursor: pointer;
    user-select: none;
}

.table th.sortable:hover {
    background: #e9ecef;
}

.table th.sortable::after {
    content: "↕";
    margin-left: var(--space-2);
    opacity: 0.3;
}

.table th.sorted-asc::after {
    content: "↑";
    opacity: 1;
}

.table th.sorted-desc::after {
    content: "↓";
    opacity: 1;
}

/* 숫자 정렬 */
.table td.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

/* 액션 컬럼 */
.table td.actions {
    text-align: right;
    white-space: nowrap;
}
```

### 8.2 페이지네이션
```css
.pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    margin-top: var(--space-6);
}

.pagination-item {
    min-width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--border-default);
    border-radius: 6px;
    background: white;
    color: var(--text-primary);
    font-size: var(--text-sm);
    cursor: pointer;
    transition: all 0.2s;
}

.pagination-item:hover:not(.disabled):not(.active) {
    background: #f8f9fa;
    border-color: var(--primary-main);
}

.pagination-item.active {
    background: var(--primary-main);
    border-color: var(--primary-main);
    color: white;
}

.pagination-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.pagination-ellipsis {
    padding: 0 var(--space-2);
    color: var(--text-secondary);
}
```

---

## 9. 접근성 (Accessibility)

### 9.1 필수 접근성 체크리스트
```css
/* 포커스 표시 - 절대 숨기지 않음 */
:focus-visible {
    outline: 2px solid var(--primary-main);
    outline-offset: 2px;
}

/* 스크린리더 전용 텍스트 */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

/* 모션 감소 설정 존중 */
@media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* 고대비 모드 */
@media (prefers-contrast: high) {
    :root {
        --border-default: #000000;
        --text-secondary: #333333;
    }
}
```

### 9.2 ARIA 속성 가이드
```html
<!-- 버튼 -->
<button aria-label="메뉴 열기" aria-expanded="false">
    <svg>...</svg>
</button>

<!-- 모달 -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <h2 id="modal-title">제목</h2>
</div>

<!-- 알림 -->
<div role="alert" aria-live="polite">
    저장되었습니다.
</div>

<!-- 탭 -->
<div role="tablist">
    <button role="tab" aria-selected="true" aria-controls="panel-1">탭 1</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">내용</div>

<!-- 로딩 -->
<button aria-busy="true" aria-describedby="loading-message">
    <span id="loading-message" class="sr-only">처리 중...</span>
</button>
```

### 9.3 색상 대비 (WCAG 2.1 AA)
```
일반 텍스트: 최소 4.5:1 대비율
큰 텍스트 (18px 이상 또는 14px 볼드): 최소 3:1 대비율
UI 컴포넌트: 최소 3:1 대비율

권장 조합:
- #212529 on #ffffff → 16.1:1 ✓
- #6c757d on #ffffff → 4.7:1 ✓
- #ffffff on #0c3026 → 12.9:1 ✓
- #ffffff on #017f97 → 4.6:1 ✓
```

---

## 10. 반응형 디자인

### 10.1 브레이크포인트 전략
```css
/* Mobile First 접근법 */

/* 기본: 모바일 (0 - 575px) */
.container {
    padding: 0 var(--space-4);
}

/* 모바일 가로 (576px - 767px) */
@media (min-width: 576px) {
    .container {
        max-width: 540px;
    }
}

/* 태블릿 (768px - 991px) */
@media (min-width: 768px) {
    .container {
        max-width: 720px;
        padding: 0 var(--space-6);
    }

    .hide-tablet-up { display: none; }
    .show-tablet-up { display: block; }
}

/* 데스크톱 (992px - 1199px) */
@media (min-width: 992px) {
    .container {
        max-width: 960px;
    }
}

/* 대형 데스크톱 (1200px+) */
@media (min-width: 1200px) {
    .container {
        max-width: 1140px;
        padding: 0 var(--space-8);
    }
}
```

### 10.2 반응형 유틸리티
```css
/* 표시/숨김 */
.hide-mobile { display: none; }
.show-mobile { display: block; }

@media (min-width: 768px) {
    .hide-mobile { display: block; }
    .show-mobile { display: none; }
    .hide-desktop { display: none; }
    .show-desktop { display: block; }
}

/* 반응형 그리드 */
.grid {
    display: grid;
    gap: var(--space-4);
    grid-template-columns: 1fr;
}

@media (min-width: 576px) {
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 768px) {
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 992px) {
    .grid-4 { grid-template-columns: repeat(4, 1fr); }
}
```

---

## 11. 마이크로인터랙션

### 11.1 호버 효과
```css
/* 카드 호버 */
.card-interactive {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-interactive:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

/* 버튼 리플 효과 */
.btn-ripple {
    position: relative;
    overflow: hidden;
}

.btn-ripple::after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%);
    background-position: center;
    background-size: 1000% 1000%;
    opacity: 0;
    transition: background-size 0.5s, opacity 0.5s;
}

.btn-ripple:active::after {
    background-size: 0% 0%;
    opacity: 1;
    transition: 0s;
}
```

### 11.2 전환 애니메이션
```css
/* 페이드 인 */
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* 슬라이드 업 */
@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 확대 */
@keyframes zoomIn {
    from {
        opacity: 0;
        transform: scale(0.9);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

/* 적용 */
.animate-fade-in { animation: fadeIn 0.3s ease; }
.animate-slide-up { animation: slideUp 0.3s ease; }
.animate-zoom-in { animation: zoomIn 0.3s ease; }
```

---

## 12. 특수 컴포넌트

### 12.1 검색 결과 하이라이트
```css
.highlight {
    background: #fff3cd;
    padding: 0 2px;
    border-radius: 2px;
}
```

### 12.2 뱃지
```css
.badge {
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    border-radius: 4px;
}

.badge-primary { background: var(--primary-light); color: var(--primary-main); }
.badge-success { background: #d4edda; color: #155724; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-danger { background: #f8d7da; color: #721c24; }

/* 숫자 뱃지 */
.badge-count {
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 10px;
    background: var(--error);
    color: white;
    font-size: 11px;
}
```

### 12.3 아바타
```css
.avatar {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: var(--primary-light);
    color: var(--primary-main);
    font-weight: var(--font-medium);
    overflow: hidden;
}

.avatar-sm { width: 32px; height: 32px; font-size: 12px; }
.avatar-md { width: 40px; height: 40px; font-size: 14px; }
.avatar-lg { width: 56px; height: 56px; font-size: 18px; }

.avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
```

### 12.4 태그 입력
```css
.tag-input-wrapper {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-2);
    border: 1px solid var(--border-default);
    border-radius: 6px;
    min-height: 44px;
}

.tag {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    background: var(--primary-light);
    border-radius: 4px;
    font-size: var(--text-sm);
}

.tag-remove {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 50%;
}

.tag-remove:hover {
    background: rgba(0, 0, 0, 0.1);
}
```

---

## 13. 인쇄 스타일

```css
@media print {
    /* 불필요한 요소 숨김 */
    .no-print,
    .header,
    .sidebar,
    .footer,
    .btn,
    .modal-overlay {
        display: none !important;
    }

    /* 배경 제거 */
    * {
        background: white !important;
        color: black !important;
        box-shadow: none !important;
    }

    /* 링크 URL 표시 */
    a[href]::after {
        content: " (" attr(href) ")";
        font-size: 0.8em;
        color: #666;
    }

    /* 페이지 나누기 */
    .page-break {
        page-break-after: always;
    }

    h1, h2, h3 {
        page-break-after: avoid;
    }

    table, figure {
        page-break-inside: avoid;
    }
}
```

---

## 14. 실무 체크리스트

### 개발 전 체크
- [ ] 디자인 시스템 변수 정의 완료
- [ ] 색상 대비 검사 (WCAG AA 이상)
- [ ] 브레이크포인트 결정
- [ ] 폰트 로딩 전략 수립

### 컴포넌트별 체크
- [ ] 모든 인터랙티브 요소 최소 44px 터치 타겟
- [ ] 포커스 상태 명확히 표시
- [ ] 로딩/에러/빈 상태 디자인
- [ ] 키보드 네비게이션 지원

### 최종 체크
- [ ] 모바일/태블릿/데스크톱 테스트
- [ ] 스크린리더 테스트
- [ ] 느린 네트워크 환경 테스트
- [ ] 인쇄 미리보기 확인
