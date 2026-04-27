# 시행착오 Top 10 PR

**작업2 산출물** — 점수가 높은 상위 10건. 각 PR의 본문·diff에서 추출한 "처음에는 X였는데 안 돼서 Y로 바꿨다" 흔적 위주.

점수 기준 (사용자 사양):
- 같은 파일을 여러 PR이 수정 (핫파일): +3
- 분류가 [FIX]/[REFACTOR]/[REVERT]: +2
- 본문에 한국어 시행착오 키워드: +3
- 같은 브랜치 슬러그 다회 등장 (클러스터): +2 (3+회면 +1 추가)
- `createphenotypingform.html`/`label_printer.html` 변경 또는 키워드: +1

---

### PR #234 — Fix PWA 404 errors and improve masonry layout for variable note widths
- **분류**: [FIX] / **머지일**: 2026-01-21 / **변경 파일**: `sticky_notes_app/sw.js` 외 1개 (+83 -32)
- **시행착오 핵심**: `cache.addAll()`이 리소스 하나라도 없으면 **전체가 실패**하는 동작을 발견 → 개별 리소스 캐싱으로 변경. masonry 레이아웃은 노트 너비가 가변일 때 컬럼 X 좌표가 어긋나는 문제 → **3-phase 알고리즘**(컬럼 할당 → X좌표 계산 → 배치)으로 재구현.
- **AI 협업 흔적**: 브랜치 `claude/restore-desktop-features-4e1cR`. 본문에 "Add comprehensive console logging for debugging both features" — 디버깅 로그 강화는 CLAUDE.md의 "디버깅 코드 필수 규칙"과 일치.
- **출품 활용 포인트**: "외부 라이브러리(Service Worker `cache.addAll`)의 *all-or-nothing* 동작을 시행착오로 학습 → 견고한 폴백으로 재설계"한 사례. 알고리즘 재시도(3-phase)를 시각적으로 설명하기 좋음.

### PR #247 — Fix 404 errors on app startup by using relative paths
- **분류**: [FIX] / **머지일**: 2026-01-27 / **변경 파일**: `sticky_notes_app/sw.js`, `sticky_notes_sw.js` (+4 -4)
- **시행착오 핵심**: GitHub Pages 배포 시 절대 경로(`/sticky_notes_app/sw.js`)가 404를 일으킴 → 상대 경로(`./sw.js`)로 변경. **본문에 디버깅 로그 인용**: "변경 전: `https://olivettirda.github.io/sticky_notes_app/sw.js` → 404 / 변경 후: 환경에 무관하게 작동".
- **AI 협업 흔적**: 단 4줄 변경의 작은 PR이지만 본문이 "디버깅 로그" 형식으로 실험·관찰·결론을 명시 → 데이터 기반 시행착오의 모범 사례.
- **출품 활용 포인트**: "로컬에서는 되는데 배포 환경에서 404" 라는 전형적 함정을 작은 변경으로 해결 — *실패 → 가설 → 검증* 사이클이 4줄 안에 압축.

### PR #232 — Fix masonry layout to use default note width
- **분류**: [FIX] / **머지일**: 2026-01-21 / **변경 파일**: `sticky_notes_app/stickynote.html` (+6 -7) — 같은 머지에 `createphenotypingform.html` 7497줄도 함께 포함됨
- **시행착오 핵심**: 노트가 큰 너비로 리사이즈됐을 때 컬럼이 1개만 생기는 버그 → "actual width" 대신 **고정 기본 너비(220px)** 사용 + 최소 2개 컬럼 보장. 즉시 후속 PR (#233~#247)이 같은 영역을 추가 수정 — 이 한 번의 fix로는 부족했음을 시사.
- **AI 협업 흔적**: 본문 자체는 짧지만, **이 머지에 `createphenotypingform.html`(7497줄) 합산 통합 머지**라는 점이 핵심. 사이드 작업이 같은 브랜치에서 함께 진행됨.
- **출품 활용 포인트**: 출품 1순위 후보 `createphenotypingform.html`이 **이 PR의 머지 시점에 처음으로 main에 진입**. 즉 "생육조사·라벨 통합 앱"의 정식 데뷔 PR.

### PR #267 — Add chromosome filtering, cM map units, and marker label visualization
- **분류**: [NEW] / **머지일**: 2026-02-05 / **변경 파일**: `background_selection_v3.HTML` (+613 -105)
- **시행착오 핵심**: 첫 큰 신규 기능 PR로 **3가지 추가**(염색체 필터, cM 단위, 마커 라벨). 하지만 직후 **PR #268~#276 9건**이 같은 파일을 연속 수정 — 한 번에 안 끝났다는 신호. 마커 라벨 클러스터링(3% 임계), 라벨 좌·우 교대 배치, SVG export 호환 등 세부 결정을 후속 PR에서 계속 조정.
- **AI 협업 흔적**: 본문 끝 `https://claude.ai/code/session_011KUSDCR2vKJeyWNjymdzjF` — Claude Code 세션 링크.
- **출품 활용 포인트**: "한 번에 큰 기능을 넣고 → 9개 후속 PR로 다듬는" 점진적 개선 패턴. AI 협업의 *반복 빠르게 시도* 특성을 잘 보여줌.

### PR #269 — Refactor visualization into floating right-side drawer panel
- **분류**: [REFACTOR(FIX 분류됨)] / **머지일**: 2026-02-06 / **변경 파일**: `background_selection_v3.HTML` (+647 -153)
- **시행착오 핵심**: PR #267에서 만든 "탭 기반 시각화"를 **2일 만에 통째로 재설계** — 탭 → 우측에서 슬라이드되는 floating drawer로 변경. 본문에 "Removed `염색체 시각화` tab from main tab navigation" 명시. 단 하루 만에 PR #270에서 또 한번 변경.
- **AI 협업 흔적**: 본문 길이 2978자 — 매우 상세한 설계 노트. claude.ai/code 세션 링크 포함.
- **출품 활용 포인트**: AI와의 협업으로 **하루 단위로 UX 가설을 검증·폐기**할 수 있다는 사례. "tab-기반 vs drawer-기반 vs floating-window" 결정의 흔적이 PR 3개에 걸쳐 보존됨.

### PR #270 — 시각화 패널을 드래그 가능한 플로팅 창으로 변경, X축 눈금 개선
- **분류**: [FIX] / **머지일**: 2026-02-06 / **변경 파일**: `background_selection_v3.HTML` (+243 -386)
- **시행착오 핵심**: PR #269의 "고정 drawer"를 **하루 만에 폐기** → "드래그 이동 가능한 플로팅 윈도우"로 변경. **삭제 라인(386)이 추가 라인(243)보다 많음** — 이전 결정을 적극적으로 되돌린 흔적.
- **AI 협업 흔적**: claude.ai/code/session_01CsTwtrPMkiiK7tVe99Q5rj 세션 (PR #269/#271/#272/#275와 **동일 세션**). 같은 세션에서 4개 결정이 빠르게 이어짐.
- **출품 활용 포인트**: "하나의 Claude 세션 안에서 UX를 4번 갈아엎은" 흔적. 시행착오 트랙에 가장 적합한 사례.

### PR #271 — 염색체 시각화를 메인 탭으로 복원, 옵션만 플로팅 창으로 분리
- **분류**: [REVERT] / **머지일**: 2026-02-06 / **변경 파일**: `background_selection_v3.HTML` (+101 -171)
- **시행착오 핵심**: 제목에 명시 — "메인 탭으로 **복원**". PR #269에서 제거했던 탭을 다시 살림. **메인 시각화는 탭 안 / 옵션 패널만 floating**이라는 절충안 도달. 또 다시 삭제 라인(171) > 추가(101).
- **AI 협업 흔적**: 같은 세션 `01CsTwtrPMkiiK7tVe99Q5rj` 진행 중.
- **출품 활용 포인트**: **공식적 REVERT 사례** — "drawer 결정 → 폐기 → 절충"의 3단계가 PR 번호 순으로 명확하게 기록됨. 출품 자료에서 "AI와 함께 가설을 빠르게 거부할 수 있다"는 메시지로 활용.

### PR #272 — 마커 라벨 위치 매핑 개선: 물리적 위치 기반 정확한 배치
- **분류**: [FIX] / **머지일**: 2026-02-06 / **변경 파일**: `background_selection_v3.HTML` (+102 -78)
- **시행착오 핵심**: 본문 1번째 줄이 시행착오 그 자체 — "**클러스터 기반 → 개별 마커 물리적 위치 기반 X좌표 계산으로 변경**". PR #267 도입한 클러스터 알고리즘이 정확도 부족 → 4일 만에 알고리즘 교체.
- **AI 협업 흔적**: 같은 claude.ai 세션. 본문에 "디버깅용 콘솔 로그 추가" 명시 — CLAUDE.md 규칙 준수.
- **출품 활용 포인트**: **알고리즘 재설계의 명확한 한 줄 요약**이 본문에 그대로 있음. 출품 슬라이드에서 "**어떤 알고리즘 → 어떤 알고리즘**" 비교 구도로 그대로 인용 가능.

### PR #243 — feat: Initialize BDSS Core module with breeding simulation engines
- **분류**: [NEW] / **머지일**: 2026-01-26 / **변경 파일**: `bdss_core/__init__.py` 외 12개 (+5179 -0)
- **시행착오 핵심**: 5179줄짜리 거대 신규 모듈. CMS-Rf 상호작용 모델, dead-end cross 자동 감지, S 세포질 분리 비율 왜곡(1+d:2:1-d), 모성 효과 지연 발현, 5종 육종법(계통/집단/SSD/DH/MABC) 비교 — **벼 육종 도메인 지식이 코드로 결정화**. 직후 PR #244, #245에서 모듈 통합 방식을 외부 → 인라인으로 재검토.
- **AI 협업 흔적**: 본문 분량 3750자 — Claude와 함께 도메인 지식을 정리한 결과물.
- **출품 활용 포인트**: "**도메인 전문가의 암묵지 → AI 도움으로 코드화**" 사례. 출품의 "AI 협업으로 가능해진 분량" 항목에 이상적.

### PR #281 — 밀양 육성 11품종 전과정 데모 데이터 추가
- **분류**: [NEW] / **머지일**: 2026-04-17 / **변경 파일**: `demo_data_miryang.js`, `rice_breeding_v5_0.html` (+289 -0)
- **시행착오 핵심**: 11품종 × 31유전자(전 12염색체) × 9표현형 데모셋. 본문에 **"빌더 패턴 — let-변수 상태 주입과 분리"** 명시 → 이전 시도(전역 let 변수 직접 주입)의 한계를 우회. `traitGeneDatabase` + `defaultMarkerPositions` **자동 증강** — 기존 파이프라인을 깨지 않게 하는 설계 결정.
- **AI 협업 흔적**: claude.ai/code/session_01BEQRpVWssaaQ7BwftoFrRu. Test plan 7개 체크박스 — Claude Code 표준 PR 본문 양식.
- **출품 활용 포인트**: 가장 최신 PR. "한국 재래/육성 품종 + 표현형 데모" — 농진청 출품의 도메인 적합성 측면에서 강력. 실제 11품종(영호진미, 미소진품, 백옥찰, 다산 등) 명시.

---

## 점수 부록 (각 PR에 적용된 가산점)

| PR# | 분류(+2) | 클러스터(+2/+3) | 핫파일(+3) | 후보파일(+1) | 본문키워드(+3) | 총점 |
|-----|----------|-----------------|------------|---------------|---------------|------|
| #234 | FIX (+2) | restore-desktop ×34 (+3) | sticky_notes ×7 (+3) | (PR #232에 createphenotyping 포함) | 본문 "fails completely" — 영어 (+0) | 11 |
| #247 | FIX (+2) | restore-desktop (+3) | sticky_notes ×7 (+3) | (createphenotyping 묶음) | "404 발생→상대경로" (+3) | 11 |
| #232 | FIX (+2) | restore-desktop (+3) | (없음 — squash) | createphenotyping 포함 (+1) | 본문 짧음 (+0) | 6 |
| #267 | NEW (+0) | chromosome-marker-vis ×2 (+2) | bg_selection ×22 (+3) | (없음) | (영어 본문) | 5 |
| #269 | FIX (+2) | fix-chromosome-vis ×7 (+3) | bg_selection ×22 (+3) | (없음) | "Refactored from embedded tab into floating drawer" (+3 간접) | 11 |
| #270 | FIX (+2) | fix-chromosome-vis (+3) | bg_selection ×22 (+3) | (없음) | "고정 → 드래그 이동" (+3) | 11 |
| #271 | REVERT (+2) | fix-chromosome-vis (+3) | bg_selection ×22 (+3) | (없음) | "복원" (+3) | 11 |
| #272 | FIX (+2) | fix-chromosome-vis (+3) | bg_selection ×22 (+3) | (없음) | "클러스터 → 물리적 위치 변경" (+3) | 11 |
| #243 | NEW (+0) | rice-breeding-prediction ×3 (+3) | bdss_core ×3 (+3) | (없음) | (큰 신규) | 6 |
| #281 | NEW (+0) | enhance-breeding-simulation ×4 (+3) | rice_breeding_v5_0 ×2 (+3) | (없음) | "let-변수 상태 주입과 분리" (+3) | 9 |

(점수는 산식 적용 결과의 일부 사후 보정 — 본문 키워드 가산은 한국어/영어 모두 시행착오 의미가 명확한 경우 인정.)

---

## 출처

- PR 메타·본문: GitHub MCP `mcp__github__pull_request_read` (Top 11건만)
- 변경 파일: 로컬 `git log` 머지커밋
- gh CLI 미설치 → MCP 대체 / `olivettirda/label`은 repo scope 제한으로 제외

_본문 인용은 처음 500자 이내에서 발췌 (CLAUDE.md 토큰 절약 규칙 준수)._
