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

## PR 생성 규칙

PR(Pull Request)을 생성한 후에는 **항상** PR 링크를 출력해야 합니다.

예시:
```
PR이 생성되었습니다: https://github.com/owner/repo/pull/123
```

이 규칙은 사용자가 PR을 쉽게 확인하고 접근할 수 있도록 하기 위함입니다.
