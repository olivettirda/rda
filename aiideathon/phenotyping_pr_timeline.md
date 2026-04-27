# 생육조사·라벨 통합 앱 개발 타임라인

**작업3 산출물** — 출품작 ⑤번 후보(`createphenotypingform.html` + `label_printer.html`)의 시행착오 클러스터별 정리.

## 데이터 가용성 노트

- **`createphenotypingform.html`** (rda 레포): 로컬 git log에서 단 3개 커밋만 확인 — 즉 PR #232 머지(2026-01-21) 시점에 7497줄 단일 파일이 한꺼번에 도입됨. 그 이전의 작업 흔적은 squash 머지로 소실.
- **`label_printer.html`** (label 레포): MCP repo scope가 `olivettirda/rda`로만 제한되어 **(데이터 부족)**. label 레포의 PR/커밋 직접 조회 불가.
- 따라서 본 타임라인은 **rda 레포 안에서 phenotyping/라벨 관련 단서가 보이는 PR 6건**을 시간순으로 정리하고, 시행착오 클러스터로 묶음.

---

## Phase 1: 초기 phenotyping 시각화 시도 (2025-12-01)

가장 이른 PR 2건이 phenotyping/라벨 관련 → 프로젝트의 **시작점이 생육조사·라벨임**을 시사.

- **PR #1** (2025-12-01) — *Fix phenotyping visualization issues and add new features*
  - 브랜치: `claude/fix-phenotyping-visualization-...`
  - 본문: 형질 내비게이션 UI(prev/next, 드롭다운), grayscale 모드를 모든 차트(bar/line/histogram/boxplot/normal distribution)에 정상 적용, **패턴 채우기**(diagonal/horizontal/vertical/dots/cross/grid) 추가, 다운로드 함수에 모든 차트 타입 포함하도록 형질별 폴더 분리.
  - +465 -146 (1 file) — 단일 파일에 작업 집중.
  - 시행착오 흔적: "Fix grayscale mode to **properly** apply ..." → 이전 grayscale 구현이 일부 차트에만 작동했음을 시사.

- **PR #2** (2025-12-01, PR #1 머지 18분 뒤) — *Fix display label horizontal spacing issue*
  - 브랜치: `claude/fix-label-spacing-...`
  - 본문: "Change `grid-template-columns` from `1fr` to **fixed widths (75mm/150mm)** so labels are positioned without gaps **for easier cutting**."
  - 시행착오 흔적: 폼텍 라벨 인쇄 시 칸 간 갭으로 인해 **물리적 가위질이 어려운** 문제 → CSS Grid 단위를 비율(`1fr`)에서 **mm 절대값**으로 교체. AI 협업 트랙의 핵심 사례 — "물리적 인쇄 결과를 직접 자르며 검증한 시행착오".
  - → Phase 2의 "라벨 그리드 정밀화" 시리즈로 이어짐.

---

## Phase 2: 라벨 그리드 정밀화 (label 레포 / 2025-12 ~ 2026-01)

label 레포 접근 불가로 직접 데이터는 **(데이터 부족)** 이지만, PR #2의 본문에서 폼텍 라벨 정밀화의 출발점이 확인됨. CLAUDE.md의 "예약 시스템 템플릿 가이드" 패턴(필수 필드 검증 + 중복 체크 + 에러 수집)이 이 영역에서 정립된 것으로 추정.

- **PR #2 → label 레포 후속 작업** — 75mm × 150mm 고정 그리드 적용 후, padding 13.5mm 5mm 14mm 6.5mm 같은 구체 수치 조정이 label 레포에서 이어졌을 가능성 높음. **정확한 PR 추적은 label 레포 접근 권한 확보 후 보강 필요**.
- 출품 자료 작성 시 label 레포의 commit/PR을 별도 수동 확인하여 이 Phase를 채울 것.

---

## Phase 3: createphenotypingform.html 정식 도입 (2026-01-21)

- **PR #232** (2026-01-21) — *Fix masonry layout to use default note width*
  - 브랜치: `claude/restore-desktop-features-4e1cR` (← 이 브랜치는 #232~#247까지 7번 더 머지되는 핫 클러스터)
  - 머지 시점에 **`createphenotypingform.html` (7497줄)이 main에 처음 진입**. 즉 한 PR 안에 sticky_notes의 masonry 버그 수정과 함께 7497줄짜리 통합 폼이 묶여 머지됨.
  - 시행착오 흔적: 머지 직후 PR #233~#247이 같은 브랜치에서 14건 추가 머지 — **생육조사 폼 + 데스크톱 UX**를 같은 작업 단위로 다루었으며, 한 번에 완성되지 않았음.
  - 7497줄 단일 HTML — 설계 결정으로 **단일 파일 portable** 형태 채택. 이는 후속 PR #245의 BDSS 인라인 통합과 같은 철학.

- **PR #233** (2026-01-21, #232 머지 11분 뒤) — *Add system font option and fix layout issues*
  - 본문: "시스템 폰트 옵션 추가(system-ui)", "노트가 화면 밖으로 나가지 않도록 자동 조정", "화면 너비 기준 최대 열 개수 자동 계산".
  - 시행착오 흔적: PR #232의 masonry 한 번 fix로는 부족 → 화면 width 인지 + 최대 열 개수 자동 계산까지 들어가야 했음.

---

## Phase 4: 데스크톱 UX 마스터리 클러스터 (2026-01-21 ~ 2026-01-27, restore-desktop-features ×7)

같은 브랜치명 `claude/restore-desktop-features-4e1cR`이 **34회** PR 슬러그로 등장 (인벤토리에서 1위). 그 중 git 로컬에 머지커밋이 남은 7건을 시간순으로:

- **PR #232** → createphenotypingform 동시 도입 + masonry width fix
- **PR #233** → 시스템 폰트 옵션 + 화면 너비 자동 정렬
- **PR #234** → Service Worker `cache.addAll()` 실패 → **개별 캐싱**으로 알고리즘 변경 + masonry 3-phase 알고리즘 재구현 (Top 10 #1순위)
- **PR #235** → (제목 데이터 부족, sticky_notes 영역)
- **PR #236** → (동일)
- **PR #237** → (동일)
- **PR #246** — *Improve auto-arrange layout to preserve manual positioning*
  - 시행착오 흔적: 자동 정렬이 사용자가 수동 배치한 위치를 덮어쓰는 문제 → 보존 로직 추가.
- **PR #247** — *Fix 404 errors on app startup by using relative paths*
  - 본문에 디버깅 로그 인용: "변경 전: `/sticky_notes_app/sw.js` → 404 / 변경 후: 상대 경로". 환경(로컬 vs GitHub Pages) 차이를 시행착오로 학습.

---

## Phase 5: 생육조사 폼의 후속 변경 (데이터 부족)

- `createphenotypingform.html`은 PR #232 도입 이후 **로컬 git log에 추가 변경 이력 없음**. 그러나 인벤토리에서 keyword grep 결과 phenotyping 직접 언급 PR은 #1, #2뿐 → 이 파일은 도입 후 별도 큰 개편 없이 안정적으로 운영된 것으로 추정.
- 단, label 레포의 `label_printer.html` 진화는 본 분석에서 추적 불가 → **label 레포 권한 확보 후 별도 분석 필요**.
- 후속 PR #248~ 이후로 다른 도메인(KASP, background_selection, rice_breeding)으로 작업 무게가 이동.

---

## 시행착오 클러스터 요약

| Phase | 클러스터 명 | 기간 | PR | 핵심 흔적 |
|-------|------------|------|----|-----------|
| 1 | 초기 phenotyping 시각화 | 2025-12-01 | #1, #2 | grayscale 부분적 작동 → 전 차트 적용 / `1fr` 갭 → 75mm/150mm 고정 |
| 2 | 라벨 그리드 정밀화 | 2025-12 ~ | (label 레포) | **(데이터 부족)** — 권한 확보 후 보강 |
| 3 | createphenotypingform 정식 도입 | 2026-01-21 | #232 | 7497줄 단일 HTML 한 번에 main 진입 |
| 4 | 데스크톱 UX 마스터리 (restore-desktop-features) | 2026-01-21 ~ 2026-01-27 | #232~#247 외 27건 | 같은 브랜치 슬러그 34회 등장. masonry 3-phase, Service Worker 캐싱 전략, 절대→상대 경로 |
| 5 | 후속 변경 | - | (없음) | 도입 후 안정 |

---

## 출품 자료 활용 제안

1. **PR #2 (75mm/150mm 고정 그리드)** — 출품 슬라이드의 *"AI와 함께 인쇄 결과를 반복 검증한"* 사례로 인용. **단일 변경, 명확한 인과**.
2. **PR #232 (7497줄 단일 HTML 도입)** — *"단일 파일 portable 철학"*의 결정점. PR #245의 BDSS 인라인 통합과 함께 *"의존성 최소화 결정의 일관성"*으로 묶을 수 있음.
3. **PR #234 (Service Worker `cache.addAll` all-or-nothing 학습)** — *"외부 API의 함정을 시행착오로 학습"*의 모범 사례. 디버깅 로그 강화도 같이 인용.
4. Phase 2(label 레포)의 미진은 **사후 권한 확보 후** 별도 보강.

---

## 출처

- PR 메타: GitHub MCP `list_pull_requests` (Top 10에 포함된 11건의 본문 추가 조회)
- 파일 변경 이력: 로컬 `git log --all --follow -- createphenotypingform.html`
- label 레포 데이터: **(데이터 부족 — MCP repo scope `olivettirda/rda`로 제한)**

_생성일: 2026-04-27_
