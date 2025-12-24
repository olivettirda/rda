# 공통 컴포넌트 패턴

복사하여 사용할 수 있는 표준 UI 컴포넌트 코드 스니펫 모음입니다.

---

## 1. 탭 네비게이션

### HTML
```html
<div class="tabs" role="tablist">
    <button class="tab active" role="tab" aria-selected="true" data-tab="tab1">탭 1</button>
    <button class="tab" role="tab" aria-selected="false" data-tab="tab2">탭 2</button>
    <button class="tab" role="tab" aria-selected="false" data-tab="tab3">탭 3</button>
</div>

<div id="tab1" class="tab-content active" role="tabpanel">
    탭 1 내용
</div>
<div id="tab2" class="tab-content" role="tabpanel">
    탭 2 내용
</div>
<div id="tab3" class="tab-content" role="tabpanel">
    탭 3 내용
</div>
```

### CSS
```css
.tabs {
    display: flex;
    border-bottom: 1px solid var(--border-default);
    gap: var(--space-1);
    margin-bottom: var(--space-6);
}

.tab {
    padding: var(--space-3) var(--space-5);
    color: var(--text-secondary);
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: var(--text-base);
    font-family: inherit;
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
    display: none;
}

.tab-content.active {
    display: block;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

### JavaScript
```javascript
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const tabId = this.dataset.tab;

        // 모든 탭 비활성화
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-content').forEach(c => {
            c.classList.remove('active');
        });

        // 선택된 탭 활성화
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
        document.getElementById(tabId).classList.add('active');
    });
});
```

---

## 2. 토스트 알림

### HTML
```html
<div class="toast-container" id="toastContainer"></div>
```

### CSS
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

.toast-success { border-left: 4px solid var(--success); }
.toast-error { border-left: 4px solid var(--error); }
.toast-warning { border-left: 4px solid var(--warning); }
.toast-info { border-left: 4px solid var(--info); }

.toast-close {
    margin-left: auto;
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.5;
    font-size: 18px;
}

.toast-close:hover {
    opacity: 1;
}
```

### JavaScript
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

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// 사용 예시
showToast('저장되었습니다.', 'success');
showToast('오류가 발생했습니다.', 'error');
showToast('주의가 필요합니다.', 'warning');
showToast('정보를 확인하세요.', 'info');
```

---

## 3. 모달

### HTML
```html
<div class="modal-overlay" id="myModal">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <div class="modal-header">
            <h3 class="modal-title" id="modalTitle">모달 제목</h3>
            <button class="modal-close" aria-label="닫기" onclick="closeModal('myModal')">&times;</button>
        </div>
        <div class="modal-body">
            <p>모달 내용이 여기에 표시됩니다.</p>
        </div>
        <div class="modal-footer">
            <button class="btn btn-outline" onclick="closeModal('myModal')">취소</button>
            <button class="btn btn-primary">확인</button>
        </div>
    </div>
</div>
```

### CSS
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
    padding: 16px 24px;
    border-bottom: 1px solid var(--border-default);
}

.modal-title {
    font-size: 20px;
    font-weight: 500;
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
    font-size: 24px;
    transition: background 0.2s;
}

.modal-close:hover {
    background: #f1f3f4;
}

.modal-body {
    padding: 24px;
    overflow-y: auto;
    max-height: 60vh;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--border-default);
    background: #f8f9fa;
}
```

### JavaScript
```javascript
function openModal(modalId) {
    document.getElementById(modalId).classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('open');
    document.body.style.overflow = '';
}

// ESC 키로 닫기
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(modal => {
            modal.classList.remove('open');
        });
        document.body.style.overflow = '';
    }
});

// 오버레이 클릭으로 닫기
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('open');
            document.body.style.overflow = '';
        }
    });
});
```

---

## 4. 파일 업로드 (드래그앤드롭)

### HTML
```html
<div class="file-upload" id="dropZone">
    <div class="file-upload-icon">📁</div>
    <p class="file-upload-text">파일을 드래그하거나 클릭하여 업로드</p>
    <p class="file-upload-hint">최대 10MB, JPG/PNG/XLSX 지원</p>
    <input type="file" id="fileInput" hidden accept=".jpg,.png,.xlsx">
</div>
```

### CSS
```css
.file-upload {
    border: 2px dashed var(--border-default);
    border-radius: 8px;
    padding: 48px 24px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.file-upload:hover,
.file-upload.drag-over {
    border-color: var(--primary-main);
    background: var(--primary-light);
}

.file-upload-icon {
    font-size: 48px;
    margin-bottom: 16px;
}

.file-upload-text {
    font-size: 16px;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.file-upload-hint {
    font-size: 14px;
    color: var(--text-secondary);
}
```

### JavaScript
```javascript
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    handleFiles(files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length === 0) return;
    const file = files[0];
    console.log('업로드된 파일:', file.name);
    // 파일 처리 로직
}
```

---

## 5. 테이블 (정렬 가능)

### HTML
```html
<div class="table-wrapper">
    <table class="table" id="dataTable">
        <thead>
            <tr>
                <th class="sortable" data-sort="name">이름 ↕</th>
                <th class="sortable" data-sort="value">값 ↕</th>
                <th>상태</th>
                <th>액션</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>항목 1</td>
                <td class="numeric">1,234</td>
                <td><span class="badge badge-success">완료</span></td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline">수정</button>
                </td>
            </tr>
        </tbody>
    </table>
</div>
```

### CSS
```css
.table-wrapper {
    overflow-x: auto;
    border: 1px solid var(--border-default);
    border-radius: 8px;
}

.table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

.table th,
.table td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border-default);
}

.table th {
    background: #f8f9fa;
    font-weight: 500;
    color: var(--text-secondary);
    white-space: nowrap;
}

.table th.sortable {
    cursor: pointer;
    user-select: none;
}

.table th.sortable:hover {
    background: #e9ecef;
}

.table tbody tr:hover {
    background: #f8f9fa;
}

.table tbody tr:last-child td {
    border-bottom: none;
}

.table td.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
}

.table td.actions {
    text-align: right;
    white-space: nowrap;
}
```

---

## 6. 로딩 상태

### 스피너
```html
<div class="loading-overlay" id="loadingOverlay">
    <div class="spinner"></div>
    <p>처리 중...</p>
</div>
```

```css
.spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-default);
    border-top-color: var(--primary-main);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    z-index: 9999;
}
```

### 스켈레톤 로딩
```html
<div class="skeleton-card">
    <div class="skeleton skeleton-avatar"></div>
    <div class="skeleton skeleton-text"></div>
    <div class="skeleton skeleton-text" style="width: 60%"></div>
</div>
```

```css
.skeleton {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
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

.skeleton-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
}
```

---

## 7. Empty State

```html
<div class="empty-state">
    <div class="empty-state-icon">📭</div>
    <h3 class="empty-state-title">데이터가 없습니다</h3>
    <p class="empty-state-description">
        아직 등록된 데이터가 없습니다. 새 데이터를 추가해보세요.
    </p>
    <button class="btn btn-primary">데이터 추가</button>
</div>
```

```css
.empty-state {
    text-align: center;
    padding: 64px 24px;
}

.empty-state-icon {
    font-size: 64px;
    margin-bottom: 24px;
    opacity: 0.5;
}

.empty-state-title {
    font-size: 20px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.empty-state-description {
    font-size: 16px;
    color: var(--text-secondary);
    margin-bottom: 24px;
    max-width: 400px;
    margin-left: auto;
    margin-right: auto;
}
```

---

## 8. XLSX 파일 다운로드 (공통 패턴)

```javascript
// XLSX 라이브러리 필요
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

function downloadExcel(data, filename = 'data.xlsx', sheetName = 'Sheet1') {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, filename);
    showToast('파일이 다운로드되었습니다.', 'success');
}

// 사용 예시
const data = [
    { 이름: '홍길동', 값: 100, 상태: '완료' },
    { 이름: '김철수', 값: 200, 상태: '진행중' }
];
downloadExcel(data, '결과.xlsx', '분석결과');
```

---

## 9. 폼 유효성 검사

```javascript
function validateForm(formId) {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('.form-input[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('is-invalid');
            isValid = false;
        } else {
            input.classList.remove('is-invalid');
        }
    });

    if (!isValid) {
        showToast('필수 항목을 입력해주세요.', 'error');
    }

    return isValid;
}

// 실시간 유효성 검사
document.querySelectorAll('.form-input[required]').forEach(input => {
    input.addEventListener('blur', function() {
        if (!this.value.trim()) {
            this.classList.add('is-invalid');
        } else {
            this.classList.remove('is-invalid');
        }
    });

    input.addEventListener('input', function() {
        if (this.classList.contains('is-invalid') && this.value.trim()) {
            this.classList.remove('is-invalid');
        }
    });
});
```

---

## 10. 검색 필터

```html
<div class="search-wrapper">
    <span class="search-icon">🔍</span>
    <input type="text" class="form-input search-input" id="searchInput" placeholder="검색...">
    <button class="search-clear" id="searchClear">&times;</button>
</div>
```

```css
.search-wrapper {
    position: relative;
}

.search-input {
    padding-left: 40px;
    padding-right: 40px;
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
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: var(--text-placeholder);
    display: none;
}

.search-input:not(:placeholder-shown) ~ .search-clear {
    display: block;
}
```

```javascript
const searchInput = document.getElementById('searchInput');
const searchClear = document.getElementById('searchClear');

searchInput.addEventListener('input', function() {
    const query = this.value.toLowerCase();
    filterData(query);
});

searchClear.addEventListener('click', function() {
    searchInput.value = '';
    filterData('');
    searchInput.focus();
});

function filterData(query) {
    // 데이터 필터링 로직
    const items = document.querySelectorAll('.data-item');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}
```
