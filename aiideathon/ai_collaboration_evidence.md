# AI 협업 흔적 모음

**작업4 산출물** — PR 본문, 커밋 메시지, 코드 주석에서 추출한 Claude/AI 협업 증거.

---

## 1. claude.ai/code 세션 링크 (PR 본문 직접 인용)

PR 본문 끝에 **`https://claude.ai/code/session_...`** 형식의 Claude Code 세션 링크가 다수 발견됨 — Claude Code가 PR을 직접 작성한 강력한 증거.

| 출처 | 세션 ID | 공유 PR |
|------|---------|---------|
| PR #281 본문 | `01BEQRpVWssaaQ7BwftoFrRu` | (단일) |
| PR #272 본문 | `01CsTwtrPMkiiK7tVe99Q5rj` | **PR #269, #270, #271, #272, #275 공유** — 한 세션에서 5개 PR 연속 작업 |
| PR #267 본문 | `011KUSDCR2vKJeyWNjymdzjF` | (단일) |
| PR #275 본문 | `01CsTwtrPMkiiK7tVe99Q5rj` | (위와 동일 세션) |

> "**한 세션 → 5개 PR 연속**"은 출품 자료의 결정적 증거. 즉 한 명의 개발자가 한 번 앉아서 Claude와 함께 시각화 UX를 다섯 번 갈아엎은 흔적.

---

## 2. 시행착오 인과를 명시한 PR 본문 (한국어)

### PR #272 (2026-02-06)
> **"클러스터 기반 → 개별 마커 물리적 위치 기반 X좌표 계산으로 변경"**

알고리즘 교체를 한 줄로 요약 — 출품 슬라이드 인용 1순위.

### PR #270 (2026-02-06)
> **"고정 드로어 → 드래그 이동 가능한 플로팅 윈도우로 변경"**
> 삭제 라인(386) > 추가 라인(243)

추가보다 삭제가 많은 PR — 적극적 폐기·재설계의 정량적 증거.

### PR #271 (2026-02-06)
> **"염색체 시각화를 메인 탭으로 복원, 옵션만 플로팅 창으로 분리"**

제목 자체에 "복원" — 직전 PR(#269, #270)의 결정을 되돌린 절충안. **공식적 REVERT 사례**.

### PR #247 (2026-01-27)
> "Service Worker 등록 경로를 절대 경로에서 상대 경로로 변경"
> "디버깅 로그:"
> "  - 변경 전: 404 에러 발생 (`https://olivettirda.github.io/sticky_notes_app/sw.js`)"
> "  - 변경 후: 상대 경로 사용으로 환경에 무관하게 작동"

본문에 **"디버깅 로그" 섹션을 명시** — CLAUDE.md의 "디버깅 코드 필수 규칙" 준수 증거.

### PR #234 (2026-01-21)
> "Service Worker: Handle 404 errors gracefully by caching resources individually instead of using `cache.addAll()` **which fails completely if any resource is missing**"

외부 API의 *all-or-nothing* 함정을 시행착오로 학습한 명확한 진술.

### PR #281 (2026-04-17)
> "**신규 모듈** `demo_data_miryang.js` (**빌더 패턴 — let-변수 상태 주입과 분리**)"

이전 시도(전역 let 변수 직접 주입)의 한계를 우회한 설계 결정.

---

## 3. 커밋 메시지 / 브랜치명에서 보이는 AI 협업

### 커밋 메시지 직접 인용
- `175e36d` — *"CLAUDE.md: 머지 규칙을 모드별로 분기"*
- `c61b411` — *"CLAUDE.md: 머지도 자동 수행 규칙으로 변경"*
- `1cee46e` — *"CLAUDE.md: PR 머지는 사용자 확인 후 수행 규칙 추가"*
- `bff534d` — *"PR 자동 생성 규칙을 CLAUDE.md에 명시"*

→ **CLAUDE.md 자체를 시행착오로 진화시킨 증거** — 협업 규칙(자동 머지 vs 사용자 확인)을 PR 단위로 바꾸고 또 되돌림.

### 브랜치명 — 274 PR 전부 `claude/...` 접두사
모든 작업이 Claude Code 브랜치 명명 규칙(`claude/<task-slug>-<random6>`)을 따름. **인벤토리 274 PR 전체가 AI 협업의 산물**.

상위 클러스터:
| 브랜치 슬러그 | PR 횟수 |
|--------------|---------|
| `restore-desktop-features` | 34 |
| `lab-booking-enhancements` | 31 |
| `fix-build-version-issue` | 19 |
| `auto-convert-sequencing-data` | 12 |
| `fix-chromosome-visualization` | 7 |
| `rice-breeding-prediction` | 3 |
| `enhance-breeding-simulation` | 4 |

---

## 4. 코드 주석 — 의도·이유를 설명한 한국어 (출처: 후보 HTML 파일 직접 grep)

### `createphenotypingform.html`
- **L22**: `/* 표준 색상 (DESIGN_SYSTEM.md 기반) */` — CLAUDE.md의 "웹앱 UI/UX 디자인 가이드" 규칙 적용
- **L44**: `/* 레거시 호환성 (accent 팔레트) */` — 기존 코드 호환을 위한 의도 표명
- **L2884**: `// SS 값 계산을 위해 rawData에서 다시 계산` — *왜 다시 계산하는지* 명시
- **L5355**: `// 1pt ≈ 0.3528mm, 화면 해상도 96dpi 기준` — 단위 변환의 근거 명시
- **L7138**: `alert('PDF 라이브러리 로딩 중입니다. 잠시 후 **다시 시도**해주세요.');` — 비동기 로딩 실패 경험에 따른 메시지

### `background_selection_v3.HTML`
- **L3019**: `// 마커 라벨을 위한 추가 여백 (하단)` — 라벨 시리즈(PR #267~#276) 결과
- **L3127**: `// 엘보우 커넥터 기준 높이: V_GAP(6) + 행높이(14) * 행수 + 폰트(9)` — 시각적 요소의 수치 근거를 코드에 박제
- **L3394**: `// 회복률 기준 정렬하여 탑 3 식별`
- **L4823**: `// 패널 상태 저장 및 일시 표시 (숨겨진 캔버스 렌더링을 위해)` — *왜 임시 저장이 필요한지* 명시 (Canvas 렌더링 트릭)
- **L3640**: `if (!confirm('변경사항이 저장되지 않았습니다. 닫으시겠습니까?'))` + L3660: `console.log('스타일 되돌림');` — **"되돌리기"** 기능 자체가 시행착오 친화적 UX

### `rice_breeding_v5_0.html`
- **L461**: `최적해가 연속으로 개선되지 않으면 알고리즘을 **조기 종료**합니다.` — 시간 절약을 위한 휴리스틱
- **L4565**: `// 주의할 길항 조합` — 도메인 지식의 코드화
- **L4809**: `// ML 모델 학습을 위한 genotype/phenotype 데이터 전달`
- **L4740**: `alert('상관행렬이 계산되지 않았습니다. 데이터를 **다시 로드**하세요.');` — 사용자에게 시행착오 회복 가이드

### `HRMguide.html`
- **L1742**: `<div class="accordion-header">Melting curve가 분리되지 않음</div>` + L1760: `<li>프라이머 재설계 (변이를 중앙으로)</li>` — **실험 실패 시나리오와 해결책을 UI에 직접 노출** = 사용자의 시행착오를 줄이려는 의도
- **L2126**: `'<span class="badge badge-hard">개선 필요</span> - SNP가 말단에 가까움, 프라이머 재설계 권장'`

### `gene_database.html`
- **L1263**: `// 2. 온라인이면 외부 API 검색 시도` — 폴백 전략
- **L1528**: `// UniProt에서도 검색 시도` — 다중 데이터 소스 폴백
- **L1580**: `btn.innerHTML = '🔍 다시 시도';` — 재시도 UX
- **L1868**: `'... 이 작업은 **되돌릴 수 없습니다**.'` — 비가역 작업 명시

---

## 5. CLAUDE.md 규칙 자체의 진화 (협업 규칙 시행착오)

CLAUDE.md 파일이 PR #278~#280에 걸쳐 3번 수정됨 (커밋: `bff534d`, `c61b411`, `1cee46e`, `175e36d`):

1. *"PR 자동 생성 규칙을 CLAUDE.md에 명시"* — 1단계: PR 생성을 자동화
2. *"PR 머지는 사용자 확인 후 수행 규칙 추가"* — 2단계: 머지는 수동 확인
3. *"머지도 자동 수행 규칙으로 변경"* — 3단계: 다시 자동 머지로 변경
4. *"머지 규칙을 모드별로 분기"* — 4단계: auto-accept 모드는 자동 / plan 모드는 수동으로 절충

→ **AI 협업 규칙 자체를 4단계의 시행착오로 진화시킨** 메타 사례. 출품 자료의 "프롬프트/로직 설계" 트랙에 결정적.

---

## 6. AI 협업 흔적이 명확하지 않은 영역 — (데이터 부족)

- **createphenotypingform.html 도입 직전 작업**: PR #232 머지에 7497줄이 한 번에 들어왔으나, 그 이전의 점진적 작업은 squash 머지로 git log에 보존되지 않음.
- **label 레포 (`label_printer.html`)**: MCP repo scope 제한으로 직접 조회 불가 → 폼텍 라벨 padding 조정 같은 세부 시행착오는 **별도 권한 확보 후 보강 필요**.
- **`prompt`/`LLM`/`anthropic`/`openai` 등 영문 키워드는 후보 HTML 파일 본문에서 검출되지 않음** — Claude를 *도구로 사용*했지 *코드 안에 LLM 호출을 박지는 않은* 것으로 확인. 즉 **사람-AI 협업으로 코드를 짠 것**이 핵심이지, 코드가 LLM을 호출하는 것은 아님.

---

## 출처

- PR 본문: GitHub MCP `mcp__github__pull_request_read` (Top 11건)
- 커밋 메시지: 로컬 `git log --all --pretty='%h %s'`
- 코드 주석: 로컬 `grep -nE '...' <file>`
- 검색 패턴:
  - 키워드: `Claude`, `AI`, `prompt`, `LLM`, `GPT`, `anthropic`, `openai`
  - 한국어 시행착오: `처음에`, `안 됐`, `다시`, `갈아엎`, `재구현`, `바꿨`, `복원`, `되돌`, `폐기`
  - 의도 주석: `때문`, `위해`, `위한`, `이유`, `기준`, `원칙`, `주의`, `TODO`, `FIXME`

_생성일: 2026-04-27_
