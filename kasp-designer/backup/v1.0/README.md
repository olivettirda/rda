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

## 2. 설계 조건 (기본값 = 벼 분자육종 표준)

| 항목 | 기본 | 비고 |
|---|---|---|
| Tm 프리셋 | **바이오니어** (Na⁺ 50 mM, Mg²⁺ 0, 올리고 250 nM, 15 nt 미만 Wallace rule) | 상단바에서 primerdigital(55 mM / 1 mM / 200 nM, 약 +5 °C)로 토글, 사용자 정의 가능 |
| ASP / Common 길이 | 18–25 nt (tail 제외) | |
| Tm | 57–62 °C, ASP–Common 차 ≤ 3 °C | **항상 tail 을 뗀 본체로 계산** |
| GC | 40–60 % | 벗어나면 경고 |
| Amplicon | 50–150 bp 권장, 300 bp 최대 (tail 포함) | 벗어나면 경고 색 |
| Tail | FAM `GAAGGTGACCAAGTTCATGCT` → 1번 대립유전자, HEX `GAAGGTCGGAGTCAACGGATT` → 2번 | 편집 가능, 3대립 이상이면 tail 없이 경고 |
| 고급 | snpOffset 1, 3′ 패턴 `n`, LC ≥ 70 %, 다이머 임계 6, 반복·저복잡도 마스킹 ON, 다이머 검사에 tail 포함 ON, bisulfite OFF | |

**판독 방식** 탭에서 겔(Allele sizing)을 고르면 tail 대신 5′ filler 로 대립유전자별 산물 길이를 사다리(아가로스 20 / PAGE 5 / CE 2 bp)로 만듭니다.

## 3. 원리 요약

- **Tm**: SantaLucia (1998) 통합 최근접이웃 ΔH/ΔS + 개시 항 + 자기상보 보정, `1/Tm = (ΔS + R·ln(Ct/4))/ΔH`. 염 보정은 Mg²⁺ 가 없거나 √[Mg]/[Na] < 0.22 이면 Owczarzy 2004(1가 양이온), 그 외 Owczarzy 2008(Mg²⁺, R < 6 이면 Na 경쟁 계수). 15 nt 미만(바이오니어)은 Wallace rule `2(A+T)+4(G+C)`. 기준값은 `node reference/tm.js` 와 ±0.05 °C 이내.
- **마스킹**: 서열과 역상보 가닥에서 2회 이상 나오는 15-mer, 17 nt 창에서 2-mer+3-mer 어휘 < 14 가 21 nt 이상 이어지는 저복잡도 블록, 주변 IUPAC, 제외구역.
- **ASP**: 대립유전자별 `allele + s3` 를 열 단위로 비교해 차이가 최대인 열을 3′ 말단으로 잡고, 길이를 늘리며 Tm 하한에 드는 가장 짧은 길이를 채택. 변이 구간 대문자, flank 소문자, 5′ 에 tail.
- **Common**: 반대 가닥의 s3 구간을 끝에서 변이 쪽으로 스캔. 마스크 → 3′ 패턴 → Tm → 단순반복(GGGG, CCCCC, AAAAA, TTTTT, GCGCGC, CGCGCG, ATATAT, TATATA) → LC → 자기 다이머 → ASP 와 cross-dimer 순으로 걸러내고, 겹치는 후보는 LC 높은 쪽만 남김. amplicon 권장 범위·Tm 차·GC·LC 로 점수화해 정렬.
- **다이머**: 짧은 쪽 5-mer 색인 → 긴 쪽 역상보 스캔, 시드에서 양방향 확장(미스매치 1개 허용), 상보쌍 ≥ 6 이면 다이머. 3′ 말단 관여·≥ 8 은 가중치.
- **LC%**: `floor(100 · (1-mer+2-mer+3-mer 종류 수) / (4 + min(N−1,16) + min(N−2,64)))`.

## 4. 개발

```
npm test        # node --test tests/*.test.js  (브라우저 없이 코어 검증, 54 tests)
npm run build   # scripts/build.js → dist/kasp-designer.html (의존성 없음)
npm run demo    # scripts/demo.js  → 예제 설계 결과를 콘솔 TSV 로
node scripts/serve.js   # 개발용 정적 서버 http://localhost:4173
```

```
src/core/   seq · tm · complexity · dimer · mask · parse · design · sizing · export · xlsx
src/ui/     app.html · style.css · app.js · viewer.js · rsid.js · icons.js
scripts/    build.js (ESM → 단일 클래식 스크립트 번들) · demo.js · serve.js
tests/      node:test 단위·통합 테스트
reference/  tm.js (Tm 기준 구현) · test_cases.json (예제 5종, 기준값)
docs/       ALGORITHM_SPEC · DESIGN_GUIDE · TASKS · screenshots/
backup/     원본 핸드오프 문서 스냅숏
```

엑셀은 SheetJS 없이 `src/core/xlsx.js` 의 자체 OOXML 작성기로 만들어 완전 오프라인입니다 (헤더 `#0c3026` + 흰 글씨, KoPub Dotum, 틀 고정 A2, 자동 필터 — Excel COM 으로 확인).

스크린샷: `docs/screenshots/` (desktop-light · desktop-dark · mobile-light · mobile-dark, 그리고 `file://` 로 연 1280px 렌더).

## 5. 구현상 판단 (확인 요망)

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
