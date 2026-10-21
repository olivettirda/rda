# 디자인 가이드 — "Apple-simple" 한국어 KASP 설계 앱

컨셉 한 줄: **여백이 많고, 글자가 또렷하고, 버튼이 하나뿐인 것처럼 보이는 실험실 도구.**
참고 감각: macOS 시스템 설정, Apple 개발자 문서, Numbers 표. 장식 없음, 그림자 최소, 모션은 짧고 자연스럽게.

---

## 1. 레이아웃

```
┌───────────────────────────────────────────────────────────┐
│  KASP 디자이너                       [바이오니어 ▾] [☾]     │  ← 상단바 52px, 반투명 blur
├───────────────┬───────────────────────────────────────────┤
│  사이드바      │   콘텐츠                                   │
│  (260px)      │                                           │
│  · 서열 입력   │   ┌─ 카드 ─────────────────────────────┐  │
│  · 설계 조건   │   │ 제목 (17px, 600)                     │  │
│  · Tail       │   │ 본문 / 폼                             │  │
│  · 결과       │   └─────────────────────────────────────┘  │
│  · 내보내기   │                                           │
│               │   [ 프라이머 설계 ]  ← 유일한 primary 버튼 │
└───────────────┴───────────────────────────────────────────┘
```
- 데스크톱: 사이드바 고정 + 콘텐츠 최대폭 980px 중앙 정렬.
- 모바일(<768px): 사이드바가 하단 탭바(SF Symbols 스타일 선형 아이콘)로 변환.
- 섹션 사이 여백 32px, 카드 안쪽 패딩 24px, 폼 행 간격 12px.

## 2. 색 (CSS 변수, 라이트/다크 자동)

```css
:root {
  --bg:        #f5f5f7;   /* Apple 회색 배경 */
  --surface:   #ffffff;
  --surface-2: #fbfbfd;
  --text:      #1d1d1f;
  --text-2:    #6e6e73;
  --line:      #d2d2d7;
  --accent:    #017f97;   /* 사용자 팔레트 primary-main — 버튼/링크/포커스 링 */
  --accent-dk: #0c3026;   /* primary-dark — 헤더 강조, 엑셀 헤더 */
  --ok:        #34c759;
  --warn:      #ff9f0a;
  --err:       #dc3545;   /* 사용자 팔레트 error */
  --radius:    12px;
  --radius-sm: 8px;
  --shadow:    0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.04);
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg:#000; --surface:#1c1c1e; --surface-2:#2c2c2e; --text:#f5f5f7; --text-2:#98989d; --line:#3a3a3c;
  --accent:#54b7c6; --accent-dk:#8dccd3;
}}
```
- 차트/도표는 사용자 컬러칩(DMRT 스타일) 그대로: `#0c3026 #017f97 #00a1b8 #54b7c6 #8dccd3`, 경고 `#dc3545`.
- 색은 **의미**에만 쓴다. 장식용 그라데이션 금지. accent는 한 화면에 한 군데.

## 3. 타이포그래피

```css
font-family: "Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo",
             "Noto Sans KR", system-ui, sans-serif;
--mono: "SF Mono", "JetBrains Mono", "D2Coding", ui-monospace, monospace;
```
- Pretendard는 CDN(jsdelivr) 로드, 실패 시 시스템 폰트.
- 크기: 페이지 제목 28/700, 카드 제목 17/600, 본문 15/400, 보조 13/400, 표 13.
- **서열·프라이머·수치는 반드시 mono**, letter-spacing 0.02em. 변이 염기는 `font-weight:700; color:var(--accent)`.
- 줄간격 1.5. 한글·영문 혼용 시 `word-break: keep-all`.

## 4. 컴포넌트 규칙

| 컴포넌트 | 규칙 |
|---|---|
| Primary 버튼 | 높이 44px, radius 10, 배경 accent, 흰 글씨 15/600. 페이지당 1개 |
| Secondary | 테두리 1px line, 배경 surface. hover: surface-2 |
| 입력 필드 | 높이 40px, radius 8, 테두리 line, 포커스 시 accent 2px ring (box-shadow) |
| 세그먼트 컨트롤 | iOS 스타일 pill 토글 — Forward/Reverse, 형광/겔, 바이오니어/primerdigital |
| 토글 스위치 | iOS 스위치 모양 (52×32), 라벨은 왼쪽 |
| 카드 | surface 배경, radius 12, shadow, 테두리 없음(다크에서는 1px line) |
| 표 | 헤더 text-2 13px uppercase 없음, 행 높이 44, 구분선 line 0.5px, hover surface-2, 숫자 우측 정렬 |
| 배지 | Tm 범위 안 = ok, 경계 = warn, 밖 = err. 텍스트 + 작은 점 |
| 토스트 | 하단 중앙, 2.5초, "복사했습니다" |
| 빈 상태 | 중앙에 선형 아이콘 + 한 줄 안내 ("서열을 붙여넣으면 시작됩니다") |

- 애니메이션: 160ms ease-out만. 등장/퇴장 opacity + 4px translate. 로딩은 accent 색 얇은 진행바(상단).
- 아이콘: Lucide (선형, 1.5px stroke, 20px). 이모지 금지.
- 모든 라벨 한국어, 단위·약어는 영문 그대로(Tm, GC%, LC%, bp, nt).

## 5. 화면별 포인트

1. **서열 입력** — 큰 mono textarea, 아래에 실시간 요약(`2개 서열 · 480 nt · GC 43.2%`), 괄호 변이는 입력창 안에서 하이라이트(contenteditable 또는 overlay). "예제 불러오기" 링크 텍스트. rsID 조회는 접힌 섹션.
2. **설계 조건** — 2열 폼. 숫자 입력은 범위 슬라이더 + 숫자 필드 동시. 고급(3′ 패턴, LC, 다이머 임계, bisulfite)은 "고급 설정" disclosure.
3. **결과** — 상단 세그먼트 Forward | Reverse. 세트 카드: ASP 2행 + Common 행, Tm 배지, amplicon 크기, 우측 상단 "복사 / 엑셀". 서열에서 tail 부분은 text-2 색, 본체는 text, 변이 염기 accent 굵게.
4. **서열 뷰어** — 결과 아래 접힌 패널. 서열 위에 프라이머 위치를 가는 막대로 표시(FAM 파랑계열 `#017f97`, HEX 청록 `#54b7c6`, Common `#0c3026`), SNP 위치 세로선.

## 6. 접근성·품질
- 모든 컨트롤 키보드 접근, 포커스 링 보임.
- 색 대비 4.5:1 이상(text-2 포함).
- `prefers-reduced-motion` 시 애니메이션 제거.
- 파비콘/앱 아이콘: `https://raw.githubusercontent.com/olivettirda/rda/refs/heads/main/ssallogo.png`
