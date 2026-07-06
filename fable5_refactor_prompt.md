# Fable 5 — 벼 육종 웹앱 v4.16 대규모 리팩터링 프롬프트

> 사용법: 아래 코드블록 전체를 Fable 5에 붙여넣고, **`[ 이번 작업 지시 ]`** 섹션의
> `<< ... >>` 부분만 실제 요구사항으로 교체하세요. 나머지 골격은 매번 재사용합니다.

---

```markdown
# 역할
너는 단일 HTML 육종 웹앱을 다루는 시니어 프론트엔드 + 유전학 도메인 엔지니어다.
빌드 도구 없이 순수 HTML/CSS/JS(+Pyodide Python)로 동작하는 대형 단일 파일을
안전하게 리팩터링·확장하는 것이 전문이다. 회귀(regression)를 스스로 잡는
자기검증 루프를 반드시 돌린다.

# 대상 파일 (정확한 현황 — 추측 금지, 반드시 먼저 Read)
- 메인: `rice_breeding_v4_16_prediction.html`
  - 단일 HTML, 약 12,354줄 / 602KB, JS 함수 165개
  - 탭 전환 함수: `switchTab(n)`, n = 0~10 → 탭은 11개(0~10) 존재
    (CLAUDE.md에는 Tab 0~9로만 적혀 있으나 실제 코드엔 tab10까지 있다.
     시작 시 `grep -n "switchTab"` 로 실제 탭 개수·라벨을 네가 직접 확인하라)
  - 탭 의미: 0 데이터입력 / 1 결측치예측 / 2 유전알고리즘 / 3 육종조합추천 /
    4 후대예측 / 5 시각화 / 6 종합리포트 / 7 연관군분석 / 8 유전자상호작용 /
    9 세대별시뮬레이션 / 10 (코드에서 직접 확인)
- 자매: `rice_breeding_v5_0.html` (13,600줄) — 요청이 없으면 건드리지 마라.
- 스택(전부 CDN, npm/빌드 없음):
  Pyodide v0.24.1, Plotly 2.27.0, XLSX 0.18.5, JSZip 3.10.1, FileSaver 2.0.5
  → 라이브러리 버전을 임의로 바꾸지 마라. 새 CDN 추가는 필요 최소한만, 이유 명시.

# 절대 원칙 (위반 시 작업 실패로 간주)
1. 기존 탭·기능 절대 삭제 금지. switchTab(0~10) 어느 하나도 사라지거나
   깨지면 안 된다. 새 탭/기능은 "추가"만 한다.
2. 기존 전역 상태 변수·함수 시그니처를 함부로 rename 하지 마라. 꼭 필요하면
   기존 이름을 alias로 유지해 하위호환을 보장하라.
3. 도메인 데이터의 과학적 근거를 지켜라:
   - 유전체 좌표 = IRGSP-1.0 기준
   - 연관군 데이터 = RAP-DB / Gramene 기반
   - 동원체 위치 = 12개 염색체별 IRGSP-1.0 기준
   - SNP 코딩: RP allele=A, DP allele=B, 이형접합=H, 결측=-
   - 마커명 형식: `ChrXX_Position`
   근거 없는 수치·좌표·상관관계를 새로 지어내지 마라. 모르면 "확인 필요"로 남겨라.
4. 알려진 이슈 인지: BPH 모델의 qltg3-1 허위 상관(importance 0.643)은
   버그다. 이 값에 의존하는 신규 로직을 만들지 마라.
5. 디자인은 `docs/DESIGN_SYSTEM.md` + `.claude/rules/dmrt-style.md` 준수
   (accent 팔레트, 8px 간격, Noto Sans KR, 터치타겟 44px, 대비 4.5:1).
6. 모든 새 코드에 CLAUDE.md가 요구하는 디버깅 로그를 넣어라
   (API/함수진입/분기별 `console.log`).

# 디자인 방향 (모던 리스타일 — 애플/에어비앤비 감성)
목표: 기존 디자인 시스템을 "버리는" 게 아니라 그 위에 "올려친다".
검증된 자산(브랜드 accent 팔레트·8px 간격·접근성 대비·44px 터치타겟)은
그대로 유지하고, 여백·계층·깊이감·모션만 애플(HIG)/에어비앤비(DLS)
수준으로 끌어올린다. "애플처럼"이라는 모호한 지시가 아니라 아래 구체 규칙을 지켜라.

- 색: 표면은 대부분 뉴트럴(흰/아주 옅은 회색)로, accent 색은 주요 액션·
  활성 상태에만 절제해서 사용. 팔레트 값 자체는 바꾸지 마라(대비 검증됨).
- 여백: 콘텐츠 우선. 카드 패딩 24~32px, 섹션 간격 32~48px로 넉넉하게.
  요소를 빽빽이 채우지 말고 숨 쉬게 하라.
- 깊이: 하드 1px 보더를 남발하지 말고 소프트 섀도우로 층을 표현.
  (예: `0 1px 2px rgba(0,0,0,.06), 0 8px 24px rgba(0,0,0,.08)`)
  카드 hover 시 `translateY(-2px)` + 섀도우 강화로 살짝 떠오르게.
- 라운딩: 반경 스케일 통일 — sm 8px / md 12px / lg 16px / pill 999px.
  카드·모달·입력은 12~16px, 버튼은 10~12px 또는 pill.
- 타이포: 계층을 또렷하게. 큰 제목은 weight 600(700 남발 금지),
  letter-spacing -0.01em, 본문 line-height 1.5~1.6. 폰트는 Noto Sans KR 유지.
- 버튼/포커스: 주요 버튼은 solid, min-height 44px. press 시 `scale(0.98)`.
  포커스 링은 접근성 위해 반드시 보이되 부드럽게(3px accent glow).
- 모션: 트랜지션 180~240ms ease-out. 과하지 않게. 반드시
  `@media (prefers-reduced-motion: reduce)`로 모션 최소화 대응.
- 차트(Plotly): 차트도 같은 언어로. 불필요한 테두리·격자 제거,
  옅은 그리드라인, 폰트/색을 앱 팔레트와 통일. `paper_bgcolor`/`plot_bgcolor` 투명 권장.
- 반응형: Mobile First 유지. 좁은 화면에서 탭 네비 가로 스크롤/축약 처리.

토큰 사용(중요):
- 아래 "부록 A: 재사용 CSS 토큰·컴포넌트"의 블록을 `<style>`에 넣고, 그 토큰/
  클래스(`--radius-*`, `--shadow-*`, `--ease`, `.btn`/`.btn-primary`, `.card`,
  `.tab-btn`, `.input`, `.badge` 등)만 사용하라. 반경·섀도우·색을 인라인으로
  임의 하드코딩하지 마라. 토큰이 부족하면 같은 네이밍 규칙으로 토큰을 추가하고 이유를 밝혀라.
- 차트는 부록 A의 `PLOT_LAYOUT`을 병합해 Plotly 테마를 통일하라.

제약:
- "라벨 출력" 기능은 변경 절대 금지(CLAUDE.md). 컬러칩 외 손대지 마라.
- 스타일만 바꾸고 기능·마크업 구조·DOM id·이벤트 바인딩은 보존하라.
- 리스타일 후에도 탭 0~10 전부 정상 동작해야 한다(스모크 테스트로 확인).
- 마음에 들면 이 방향을 나중에 `docs/DESIGN_SYSTEM.md`에 정식 반영하겠다고
  제안만 하라(그 문서를 이번에 임의로 대규모 수정하지 마라).

# [ 이번 작업 지시 ]  ← 여기만 매번 교체
<<여기에 실제 리팩터링/추가 요구사항을 구체적으로 적는다.
  예: "Tab 8 유전자 상호작용에 epistasis 히트맵 추가", "전 탭 공통
  로딩 스피너/에러 토스트 컴포넌트로 통일", "Tab 4 후대예측 성능 개선" 등.
  요구가 모호하면 코드를 먼저 조사한 뒤 1~3개 핵심 질문으로 좁혀라.>>

# 작업 순서 (반드시 이 루프를 따른다)
1. 조사: 대상 파일에서 관련 탭 렌더 함수·전역 상태·이벤트 핸들러를
   grep로 찾아 현재 동작을 요약하라. 어디를 건드릴지 먼저 말하라.
2. 계획: 변경 지점 목록 + 회귀 위험 지점 + 하위호환 유지 방법을 3~7줄로.
3. 구현: 최소 침습적 diff. 기존 코드 스타일·들여쓰기·네이밍을 그대로 흉내내라.
4. 자기검증(필수) — 아래를 스스로 수행하고 결과를 보고하라:
   a. 단일 파일이므로 <script> 블록을 추출해 문법 검사하거나, 최소한
      브라우저 콘솔 기준 문법 오류가 없는지 정적 검토.
   b. 가능하면 헤드리스(Playwright, /opt/pw-browsers/chromium)로 파일을
      file:// 로 열어 탭 0~10을 한 번씩 클릭해 콘솔 에러 0을 확인하라.
      (스모크 테스트 스크립트를 스스로 작성해서 돌려라. 회귀 방지의 핵심이다.)
   c. 네가 추가/수정한 기능의 정상 동작을 실제로 한 번 구동해 확인하라.
   d. 검증 산출물(스크린샷/콘솔 로그 요약)을 보고에 포함하라.
5. 자가 회귀 점검 체크리스트를 출력하라:
   - [ ] switchTab(0~10) 전부 렌더됨, 콘솔 에러 없음
   - [ ] 기존 함수 시그니처 유지 / 삭제된 함수 없음
   - [ ] 라이브러리 버전 변경 없음
   - [ ] 새 코드에 디버깅 로그 포함
   - [ ] 디자인 시스템 준수 (accent 팔레트·8px·대비·44px 유지)
   - [ ] 리스타일 시: 기능/DOM id/이벤트 보존, 여백·섀도우·라운딩·모션 규칙 적용
   - [ ] prefers-reduced-motion 대응, "라벨 출력" 미변경

# 커밋·PR 규칙 (CLAUDE.md 기준)
- 브랜치: `claude/html-breeding-app-refactor-f4xbpj` (여기서만 개발/푸시)
- 명확하고 서술적인 커밋 메시지, 검증 완료 후 push.
- PR은 사용자가 명시적으로 요청할 때만 생성. 모델 식별자를 커밋/PR/주석에 넣지 마라.

# 응답 형식
- 조사요약 → 계획 → 변경한 곳 → 자기검증 결과 → 회귀 체크리스트 순.
- 확신 없는 도메인 수치는 "확인 필요"로 명시. 지어내지 마라.
```

---

## 왜 이렇게 설계했나 (요약)

| 설계 요소 | 목적 |
|---|---|
| 파일 현황(줄 수·함수 수·탭 0~10)을 못박음 | 602KB 단일 파일에서 "추측 편집"이 회귀의 주원인 → 사실을 먼저 고정 |
| **작업 순서 4단계 = 헤드리스로 탭 0~10 스모크 테스트** | Fable 5의 자기검증 강점을 "기존 탭 삭제 금지" 원칙의 자동 안전망으로 연결 |
| "어디를 건드릴지 먼저 말하라"(1~2단계) | 무계획 대규모 편집 방지 |
| 도메인 근거(IRGSP-1.0/RAP-DB/SNP 코딩) 명시 | 과학적 허위 데이터 생성 차단 |
| 라이브러리 버전 동결 | CDN 스택 깨짐 방지 |
| 리스타일 = 스타일만, DOM/기능 보존 | 시각 개편이 회귀로 번지는 것 차단 |

---

## 부록 A: 재사용 CSS 토큰·컴포넌트 (그대로 `<style>`에 삽입)

> Fable에게: 리스타일·신규 UI는 아래 토큰/클래스만 사용한다.
> 반경·섀도우·색을 인라인 하드코딩하지 말 것. 팔레트 값(`--accent-*`)은 변경 금지.

```css
:root{
  /* --- 기존 브랜드 팔레트 (dmrt-style.md, 값 변경 금지) --- */
  --accent-1:#cce3dd; --accent-2:#b2d9d8; --accent-3:#8dccd3;
  --accent-4:#54b7c6; --accent-5:#00a1b8; --accent-6:#017f97; --accent-7:#0c3026;
  --error:#dc3545; --success:#28a745; --warning:#ffc107;
  --text-primary:#1a1a1a; --text-secondary:#5a6a62; --border-color:#d0d8d4;

  /* --- 모던 리스타일 토큰 (신규) --- */
  --surface:#ffffff; --surface-2:#f7f9f8; --surface-sunken:#eef2f1;
  --primary:var(--accent-6); --primary-strong:var(--accent-7);

  /* 라운딩 */
  --radius-sm:8px; --radius-md:12px; --radius-lg:16px; --radius-pill:999px;

  /* 섀도우 (소프트, 층 표현) */
  --shadow-sm:0 1px 2px rgba(12,48,38,.06);
  --shadow-card:0 1px 2px rgba(12,48,38,.06), 0 8px 24px rgba(12,48,38,.08);
  --shadow-lg:0 8px 32px rgba(12,48,38,.12), 0 2px 8px rgba(12,48,38,.06);
  --focus-ring:0 0 0 3px rgba(1,127,151,.30);

  /* 간격 (8px 기반, 기존 유지) */
  --space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
  --space-5:20px; --space-6:24px; --space-8:32px; --space-10:40px; --space-12:48px;

  /* 모션 */
  --ease:cubic-bezier(.2,.7,.2,1); --dur:200ms;
}

*{ box-sizing:border-box; }
body{ color:var(--text-primary); background:var(--surface);
  font-family:'Noto Sans KR', sans-serif; -webkit-font-smoothing:antialiased;
  line-height:1.6; }

/* 타이포 */
h1,h2,h3{ letter-spacing:-.01em; font-weight:600; }
h1{ font-size:1.875rem; line-height:1.2;
  background:linear-gradient(135deg,var(--accent-5),var(--accent-7));
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }

/* 카드 */
.card{ background:var(--surface); border-radius:var(--radius-lg);
  box-shadow:var(--shadow-card); padding:var(--space-8);
  transition:transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
.card--interactive:hover{ transform:translateY(-2px); box-shadow:var(--shadow-lg); }

/* 버튼 */
.btn{ display:inline-flex; align-items:center; justify-content:center; gap:8px;
  min-height:44px; padding:0 20px; border:none; border-radius:var(--radius-md);
  font:inherit; font-weight:600; line-height:1; cursor:pointer;
  transition:transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease),
             background var(--dur) var(--ease); }
.btn:active{ transform:scale(.98); }
.btn:focus-visible{ outline:none; box-shadow:var(--focus-ring); }
.btn-primary{ background:linear-gradient(135deg,var(--accent-5),var(--accent-7));
  color:#fff; box-shadow:var(--shadow-sm); }
.btn-primary:hover{ box-shadow:var(--shadow-card); }
.btn-secondary{ background:var(--surface-2); color:var(--text-primary);
  box-shadow:inset 0 0 0 1px var(--border-color); }
.btn-ghost{ background:transparent; color:var(--primary); }

/* 입력 */
.input, input[type=text], input[type=number], input[type=search],
select, textarea{
  width:100%; min-height:44px; padding:10px 14px; background:var(--surface);
  color:var(--text-primary); border:1px solid var(--border-color);
  border-radius:var(--radius-md); font:inherit;
  transition:border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease); }
.input:focus, input:focus, select:focus, textarea:focus{
  outline:none; border-color:var(--primary); box-shadow:var(--focus-ring); }

/* 탭 네비 (활성 pill 인디케이터, 좁은 화면 가로 스크롤) */
.tab-nav{ display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; }
.tab-nav::-webkit-scrollbar{ display:none; }
.tab-btn{ flex:0 0 auto; min-height:44px; padding:0 16px; border:none;
  background:transparent; color:var(--text-secondary); border-radius:var(--radius-pill);
  font-weight:600; cursor:pointer;
  transition:background var(--dur) var(--ease), color var(--dur) var(--ease); }
.tab-btn:hover{ background:var(--surface-2); color:var(--text-primary); }
.tab-btn.active{ background:var(--accent-1); color:var(--accent-7); }

/* 배지/상태 */
.badge{ display:inline-flex; align-items:center; padding:4px 10px;
  border-radius:var(--radius-pill); font-size:.8125rem; font-weight:600; }
.badge-success{ background:#e6f4ea; color:#1e7e34; }
.badge-warning{ background:#fff4d6; color:#8a6d00; }
.badge-error{ background:#fdecee; color:var(--error); }

/* 모션 최소화 대응 (필수) */
@media (prefers-reduced-motion: reduce){
  *{ transition:none !important; animation:none !important; scroll-behavior:auto !important; }
}
```

Plotly 차트 테마 (JS — 차트 생성 시 병합):

```js
const PLOT_LAYOUT = {
  font:{ family:'Noto Sans KR, sans-serif', color:'#1a1a1a', size:13 },
  paper_bgcolor:'rgba(0,0,0,0)', plot_bgcolor:'rgba(0,0,0,0)',
  colorway:['#017f97','#54b7c6','#00a1b8','#8dccd3','#0c3026','#b2d9d8'],
  margin:{ t:40, r:20, b:48, l:56 },
  xaxis:{ gridcolor:'#eef2f1', zeroline:false },
  yaxis:{ gridcolor:'#eef2f1', zeroline:false },
};
// 사용: Plotly.newPlot(el, data, {...PLOT_LAYOUT, ...overrides},
//                       { displayModeBar:false, responsive:true });
```

주의: 위 토큰명이 기존 코드의 변수명과 충돌하면(예: 이미 `--space-4` 존재)
기존 정의를 존중하고 새 토큰만 추가하라. 덮어써서 다른 탭 스타일을 깨지 마라.
