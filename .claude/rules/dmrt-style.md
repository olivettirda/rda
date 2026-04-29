---
applyTo: "**/*.{html,css,jsx,tsx}"
---

# DMRT 스타일 규칙 (UI 파일 자동 로드)

이 파일은 HTML/CSS/JSX 작업 시 자동으로 로드됩니다.

## CSS 변수 표준

웹앱 프로젝트의 모든 HTML/CSS 파일은 아래 변수를 `:root`에 포함합니다.

```css
:root {
  /* 라이트 테마 (기본 분석 도구용) */
  --accent-1: #cce3dd;
  --accent-2: #b2d9d8;
  --accent-3: #8dccd3;
  --accent-4: #54b7c6;
  --accent-5: #00a1b8;
  --accent-6: #017f97;
  --accent-7: #0c3026;
  
  --error: #dc3545;
  --text-primary: #1a1a1a;
  --text-secondary: #5a6a62;
  --border-color: #d0d8d4;
}
```

## 그라데이션 헤더 표준

```css
h1 { 
  background: linear-gradient(135deg, var(--accent-5), var(--accent-7)); 
  -webkit-background-clip: text; 
  -webkit-text-fill-color: transparent; 
  background-clip: text; 
}
```

## 폰트 import 표준

```html
<link href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
body { font-family: 'Noto Sans KR', sans-serif; }
code, pre { font-family: 'JetBrains Mono', monospace; }
```
