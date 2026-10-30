# KASP 디자이너 — 한국어 UI KASP / AS-PCR 프라이머 설계 앱

더블클릭으로 오프라인에서 동작하는 **단일 HTML**(`dist/kasp-designer.html`) 프라이머 설계 도구입니다.
primerdigital.com KASP 도구와 **같은 원리**(SantaLucia 1998 + Owczarzy 염 보정, Linguistic Complexity, 5-mer 시드 다이머, 15-mer 반복 마스킹)를 공개 문헌과 `docs/ALGORITHM_SPEC.md`만 보고 클린룸으로 재구현했습니다. 외부 코드는 한 줄도 쓰지 않았습니다.

## 1. 바로 쓰기

1. `dist/kasp-designer.html` 을 더블클릭합니다 (인터넷 불필요. 폰트·파비콘만 온라인일 때 CDN에서 가져오고, 없으면 시스템 폰트).
2. **서열 입력** 에 FASTA + 대괄호 변이 표기를 붙여넣습니다. "예제 불러오기"로 5종 예제를 넣어 볼 수 있습니다.
3. **프라이머 설계** 를 누르면 **결과** 화면에 Forward / Reverse 두 세트(ASP 2개 + Common)가 나옵니다.
4. **내보내기** 에서 TSV 복사 또는 엑셀(.xlsx, 주문용·설계근거 2시트) 다운로드.

입력 표기

| 표기 | 뜻 |
|---|---|
| `[A/G]` | SNP (이중대립) |
| `[A/C/G/T]` | 다중대립 |
| `[R]` | IUPAC 1문자 (R → A, G 로 전개) |
| `[AG/]` 또는 `[AG/-]` | InDel (빈 쪽 = 결실, 라벨 `del`) |
| `[GATATAC/CAGTCC]` | MNV / 하플로타입 |
| 괄호 밖 `r`, `y` … | 주변 SNP → 프라이머가 덮지 않도록 마스킹 |
| `/…/` | 프라이머 배치 금지 구역 |
| 헤더 `>이름 Chr01:1234567` | 변이 첫 염기의 유전체 좌표(IRGSP-1.0) → 설계근거 시트에 Chr:bp 로 변환 |

헤더가 없으면 `Seq1`, `Seq2` …, `이름<공백>서열` 한 줄 형식도 됩니다. 여러 레코드를 한 번에 넣으면 일괄 설계되고 엑셀에도 함께 저장됩니다.

### 작물 모드 (벼 · 밀 · 일반)

서열 입력 탭 맨 위에서 고릅니다.

| 모드 | 유전체 좌표 | rsID 종 | 특징 |
|---|---|---|---|
| **벼** (기본) | IRGSP-1.0, `Chr01:…` | `oryza_sativa` | 이배체. 기존 동작 그대로 |
| **밀** | IWGSC RefSeq v2.1, `1A:…` / `chr1A:…` | `triticum_aestivum` | 육배체(AABBDD). **상동유전체(homoeolog) 서열**을 함께 넣으면 ASP·Common 을 B·D 등 다른 유전체 서열과 비교해 **염색체 특이 / 반특이 / 비특이**(PolyMarker 기준: 3′ 말단 불일치 / 내부 불일치 / 완전 일치)를 판정하고, Common 후보 점수에 벌점(비특이 +30, 반특이 +8)을 주어 특이 후보가 위로 오게 합니다. 엑셀 설계근거 시트에 "상동유전체 특이성" 열이 추가됩니다. 상동 서열이 없으면 경고만 하고 벼와 같은 방식으로 설계합니다. |
| **일반** | 헤더 표기 그대로 | 직접 입력 | 다른 작물. 상동/중복 서열 검사 가능 |

"밀 예제 (합성)" 버튼은 벼 예제 서열에 규칙적 치환을 넣어 만든 **가상 데이터**로, 기능 확인용입니다. 실제 밀 마커는 목표 유전체 서열(예: A)과 나머지 유전체(B, D)의 같은 구간을 IWGSC RefSeq 에서 가져와 넣으세요. 참고 문헌(설계 조건 탭 맨 아래 "참고 문헌")에 밀 KASP 설계 지침(Makhoul 2020), PolyMarker, IWGSC RefSeq, 밀 KASP 사례(Rasheed 2016, Grewal 2020)를 정리했습니다.

### 바이오니어 업로드 양식

내보내기 탭의 **바이오니어 업로드 양식** 카드에서 Scale(25–15000 nmole)·Purification(BioRP/PAGE/HPLC)을 ASP·Common 별로 고르고 `.xlsx` 를 받으면, 바이오니어 공식 양식 `Upload_Bioneer_DNA.xls` 와 같은 시트명·열(Oligo NAME · Scale · Purification · SEQUENCE 5′→3′)·드롭다운으로 저장됩니다. 이름의 `#` `|` 는 제거되고 서열은 tail 포함 전체 염기만 대문자로 들어갑니다. 주문 페이지가 `.xls` 만 받으면 엑셀에서 "Excel 97-2003 (*.xls)" 로 다시 저장해 올리세요. '복사 후 붙여넣기' 입력창용 TSV 도 복사할 수 있습니다.

### 반응형 레이아웃

- **≥ 1100px**: 왼쪽 사이드바(260px) + 표 형태의 결과.
- **768–1099px**(태블릿·좁은 창): 사이드바가 아이콘 레일(76px)로 접히고, 콘텐츠 폭이 좁으면 표가 카드형 목록으로 바뀝니다.
- **< 768px**(모바일): 사이드바가 하단 탭바로, 상단바는 로고·프리셋·테마·도움말만, 표는 카드형 목록(ID · 줄바꿈되는 서열 · 길이/Tm/GC/LC 칩), 서열 뷰어는 화면 폭에 맞춰 한 줄 염기 수를 자동 조정합니다. iPhone 하단 안전영역(safe-area)도 반영합니다.

### 튜토리얼과 서면 매뉴얼

- **처음 실행 때 한 번만** 튜토리얼이 자동으로 시작됩니다. 화면이 어두워지면서 해당 칸만 밝게 비추고 설명 카드가 따라갑니다(26단계, 약 2분). "건너뛰기"·Esc·× 로 언제든 중단할 수 있고, 한 번 뜬 뒤에는 다시 자동으로 나오지 않습니다(브라우저 저장소에 기록). "다음"/→ 키로 넘기고 ← 로 돌아갑니다. 예제 서열 입력·분석·설계는 튜토리얼이 알아서 실행해 보여 줍니다.
- 상단의 **?** 버튼에서 언제든 다시 재생하거나 **서면 매뉴얼**(같은 내용을 글로, 항목마다 "이 단계 재생" 링크)을 볼 수 있습니다.

### 처음 사용 3단계 (앱의 **프라이머 분석** 탭 상단에도 있음)

1. **서열 입력** 탭에 마커 서열을 붙여넣습니다. 변이는 `[A/G]`, 양쪽 flank 100–200 nt.
2. **설계 조건**은 기본값으로 시작합니다. 이미 쓰던 프라이머가 있으면 **프라이머 분석** 탭에 붙여넣고 "분석" → "이 조건 적용".
3. **프라이머 설계** → **결과** 탭에서 경고가 적은 세트(Forward / Reverse) 선택 → **내보내기** 탭에서 주문용 엑셀.

### 기존 프라이머 분석 (역설계 가이드)

**프라이머 분석** 탭에 가지고 있던 프라이머를 `이름<탭>서열` 형식(FASTA, 공백 구분, 숫자 열 포함 표도 가능)으로 붙여넣으면:

- tail(FAM/HEX 또는 Tail 탭의 서열)을 자동으로 떼어 **본체 Tm 을 두 프리셋(바이오니어 / primerdigital)으로** 계산하고 GC, LC, 단순반복, 자기·교차 다이머를 표시합니다.
- 서열 입력 탭의 템플릿을 고르면 양 가닥에서 위치(불일치 2개까지)를 찾아 **ASP / Common 역할**, 3′ 말단이 변이에 있는지, 3′ 2번째 의도적 미스매치, **amplicon 크기**를 판정합니다.
- 관찰값으로부터 "비슷하게 설계하려면" 쓸 조건(프리셋, Tm 범위, 길이, GC, amplicon, tail, Tm 차, LC)을 추정해 현재 조건과 나란히 보여 주고, **이 조건을 설계 조건에 적용** 또는 **적용하고 바로 설계** 버튼으로 반영합니다.

## 2. 설계 조건 (기본값 = 벼 분자육종 표준)

| 항목 | 기본 | 비고 |
|---|---|---|
| Tm 프리셋 | **바이오니어** (Na⁺ 50 mM, Mg²⁺ 0, 올리고 250 nM, 15 nt 미만 Wallace rule, ln(Ct/4)) | 상단바에서 primerdigital(55 mM / 1 mM / 200 nM, **ln(Ct) 관례** — 사이트 실측 38개와 ±0.05 °C 일치)로 토글, 사용자 정의 가능 |
| ASP / Common 길이 | 18–28 nt (tail 제외) | primerdigital 사이트 기본과 동일. Tm 하한에 드는 가장 짧은 길이를 고르므로 보통 18–25 에서 끝남 |
| Tm | 바이오니어 57–62 °C, primerdigital 60–62 °C (프리셋을 바꾸면 기본 창이 따라 바뀜), ASP–Common 차 ≤ 3 °C | **항상 tail 을 뗀 본체로 계산** |
| GC | 40–60 % | 벗어나면 경고 |
| Amplicon | 50–150 bp 권장, 300 bp 최대 (tail 포함) | 벗어나면 경고 색 |
| Tail | FAM `GAAGGTGACCAAGTTCATGCT` → 1번 대립유전자, HEX `GAAGGTCGGAGTCAACGGATT` → 2번 | 편집 가능, 3대립 이상이면 tail 없이 경고 |
| 고급 | snpOffset 1, 3′ 패턴 `n`, LC ≥ 70 %, 다이머 임계 7 bp(정확 연속 상보, 6 bp 는 경고), 미스매치 허용 OFF, 반복·저복잡도 마스킹 ON, 다이머 검사에 tail 포함 ON, bisulfite OFF | 다이머 기준은 사이트 실측(6 bp 회문·5+1 통과)에 맞춤 |

**판독 방식** 탭에서 겔(Allele sizing)을 고르면 tail 대신 5′ filler 로 대립유전자별 산물 길이를 사다리(아가로스 20 / PAGE 5 / CE 2 bp)로 만듭니다.

## 3. 원리 요약

- **Tm**: SantaLucia (1998) 통합 최근접이웃 ΔH/ΔS + 개시 항 + 자기상보 보정, `1/Tm = (ΔS + R·ln(Ct/d))/ΔH` (d = 4 표준 관례, primerdigital 프리셋은 d = 1 — 사이트 출력 38개 프라이머로 역산해 확인). 염 보정은 Mg²⁺ 가 없거나 √[Mg]/[Na] < 0.22 이면 Owczarzy 2004(1가 양이온), 그 외 Owczarzy 2008(Mg²⁺, R < 6 이면 Na 경쟁 계수). 15 nt 미만(바이오니어)은 Wallace rule `2(A+T)+4(G+C)`. 기준값은 `node reference/tm.js` 와 ±0.05 °C 이내.
- **마스킹**: 서열과 역상보 가닥에서 2회 이상 나오는 15-mer, 17 nt 창에서 2-mer+3-mer 어휘 < 14 가 21 nt 이상 이어지는 저복잡도 블록, 주변 IUPAC, 제외구역.
- **ASP**: 대립유전자별 `allele + s3` 를 열 단위로 비교해 차이가 최대인 열을 3′ 말단으로 잡고, 길이를 늘리며 Tm 하한에 드는 가장 짧은 길이를 채택. 변이 구간 대문자, flank 소문자, 5′ 에 tail.
- **Common**: 반대 가닥의 s3 구간을 끝에서 변이 쪽으로 스캔. 마스크 → 3′ 패턴 → Tm → 단순반복(GGGG, CCCCC, AAAAA, TTTTT, GCGCGC, CGCGCG, ATATAT, TATATA) → LC → 자기 다이머 → ASP 와 cross-dimer 순으로 걸러내고, 겹치는 후보는 LC 높은 쪽만 남김. amplicon 권장 범위·Tm 차·GC·LC 로 점수화해 정렬.
- **다이머**: 짧은 쪽 5-mer 색인 → 긴 쪽 역상보 스캔, 시드에서 양방향 확장해 정확 연속 상보쌍을 센다. ≥ 7 이면 다이머(탈락), 6 은 경고. 고급 설정에서 미스매치 1개 허용(엄격)을 켤 수 있다. 3′ 말단 관여·≥ 8 은 가중치.
- **LC%**: `floor(100 · (1-mer+2-mer+3-mer 종류 수) / (4 + min(N−1,16) + min(N−2,64)))`.

## 4. 개발

```
npm test        # node --test tests/*.test.js  (브라우저 없이 코어 검증, 66 tests)
npm run build   # scripts/build.js → dist/kasp-designer.html (의존성 없음)
npm run demo    # scripts/demo.js  → 예제 설계 결과를 콘솔 TSV 로
node scripts/serve.js   # 개발용 정적 서버 http://localhost:4173
```

```
src/core/   seq · tm · complexity · dimer · mask · parse · design · sizing · analyze · specificity(상동유전체) · crop(작물 모드·문헌) · export · xlsx
src/ui/     app.html · style.css · app.js · viewer.js · rsid.js · icons.js · tour.js(스포트라이트 엔진) · tourSteps.js(단계 내용)
scripts/    build.js (ESM → 단일 클래식 스크립트 번들) · demo.js · serve.js
tests/      node:test 단위·통합 테스트
reference/  tm.js (Tm 기준 구현) · test_cases.json (예제 5종, 기준값)
docs/       ALGORITHM_SPEC · DESIGN_GUIDE · TASKS · screenshots/
backup/     원본 핸드오프 문서 스냅숏
```

엑셀은 SheetJS 없이 `src/core/xlsx.js` 의 자체 OOXML 작성기로 만들어 완전 오프라인입니다 (헤더 `#0c3026` + 흰 글씨, KoPub Dotum, 틀 고정 A2, 자동 필터 — Excel COM 으로 확인).

스크린샷: `docs/screenshots/` (desktop-light · desktop-dark · mobile-light · mobile-dark, 그리고 `file://` 로 연 1280px 렌더).

## 4-1. GitHub Pages 배포

두 가지 방법 중 하나를 쓰면 됩니다 (둘 다 준비되어 있음).

- **GitHub Actions (권장)**: 저장소 Settings → Pages → Build and deployment → Source 를 **GitHub Actions** 로 두면 `main` 에 push 할 때마다 `.github/workflows/pages.yml` 이 테스트·빌드 후 `dist/` 를 배포합니다. 주소는 `https://<계정>.github.io/<저장소>/` (= `dist/index.html`).
- **브랜치 배포**: Source 를 `main` 브랜치 · `/ (root)` 로 두면 루트의 `index.html` 이 `dist/kasp-designer.html` 로 바로 이동시킵니다. `.nojekyll` 이 있어 파일이 그대로 제공됩니다.

## 4-2. 현재 배포 주소와 업데이트 방법

- 앱: **https://olivettirda.github.io/rda/kasp-designer/** (→ `dist/kasp-designer.html` 로 이동)
- 이 프로젝트는 `olivettirda/rda` 저장소의 `kasp-designer/` 하위 폴더로 들어가 있습니다(`git subtree`, 이력 보존). rda 의 GitHub Pages 가 `main` 루트를 배포하므로 push 하면 1~2분 뒤 반영됩니다.
- 업데이트: 이 폴더에서 수정 → `npm test` → `npm run build` → 커밋한 뒤, rda 복제본에서 아래를 실행합니다.

```
git subtree pull --prefix=kasp-designer "C:\Users\owner\Desktop\kasp-handoff" main -m "KASP 디자이너 업데이트"
git push origin main
```

push 는 GitHub 로그인 창이 뜰 수 있으니 대화형 터미널에서 실행합니다.

## 5. 구현상 판단 (확인 요망)

- **primerdigital 보정(2026-10-30)**: 사이트의 bsr1_snp913 결과(38개 프라이머)와 비교하니 GC%·LC% 는 완전히 같고 Tm 만 일정하게 1.4–2.3 °C 낮았습니다. 엔트로피 항을 ln(Ct/4) 대신 ln(Ct) 로 두면 전부 ±0.05 °C 안에 들어와 그렇게 맞췄습니다. 바이오니어 프리셋은 실측값이 없어 ln(Ct/4) 관례를 유지했습니다 — 바이오니어 계산기 값이 있으면 같은 방법으로 맞출 수 있습니다.
- 프라이머 ID 의 좌표는 5′→3′ 순서(역가닥은 `R_243-217` 처럼 큰 수가 먼저)로 사이트와 같게 표기합니다. Common 후보는 기본적으로 인접 후보까지 모두 보여 주고(겹침 허용), 표에서 점수순/위치순을 고를 수 있습니다. amplicon 은 tail 포함 길이와 함께 tail 제외 길이도 표시합니다(사이트는 tail 없이 설계하면 tail 제외 길이만 보여 줌).

- **다이머 검사에 tail 포함**이 기본입니다 (실제 합성되는 올리고 기준). 고급 설정에서 끌 수 있습니다.
- ASP 간 cross-dimer 는 사양대로 **경고만** 하고 LC 값은 실제 값을 유지합니다 (primerdigital 은 LC=0 으로 표시).
- 제외구역/주변 변이가 ASP 범위에 들어오면 **피할 수 있는 길이 안에서** Tm 하한을 찾고, 못 찾으면 가장 긴 길이로 설계하며 경고합니다 (예제 Marker_Excl 의 Forward 세트: 20 nt, Tm 56.8 °C).
- Allele sizing 의 filler 6종은 결정론적 의사난수로 만든 60 nt 서열(GC 45–55 %, 4연속 염기·단순반복·자기 다이머 없음)입니다.
- rsID 조회는 Ensembl REST(`rest.ensembl.org`, 벼 `oryza_sativa`)를 쓰며 CORS 허용(`*`)이 확인되었습니다. 오프라인이면 조용히 안내만 합니다.

## 6. 인용

- SantaLucia J (1998) PNAS 95:1460–1465. doi:10.1073/pnas.95.4.1460
- Owczarzy R et al (2004) Biochemistry 43:3537–3554. doi:10.1021/bi034621r
- Owczarzy R et al (2008) Biochemistry 47:5336–5353. doi:10.1021/bi702363u
- Kalendar R et al (2022) Front Mol Biosci 9:773956. doi:10.3389/fmolb.2022.773956
- Kalendar R (2025) Mol Ther Nucleic Acids 36(4):102716. doi:10.1016/j.omtn.2025.102716
- Kalendar R et al (2017) Genomics 109:312–319. doi:10.1016/j.ygeno.2017.05.005
