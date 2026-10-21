# KASP 프라이머 설계 알고리즘 사양서

> primerdigital.com KASP 도구(Kalendar, FastPCR 엔진)의 공개 JS를 분석해 **동작 원리**를 정리한 문서입니다.
> 원본 코드는 저작권이 있으므로 복사하지 말고, 이 사양과 인용 문헌만 보고 **클린룸으로 재구현**합니다.
> 모든 수치는 `reference/tm.js`와 `reference/test_cases.json`으로 검증합니다.

---

## 0. 용어

| 용어 | 뜻 |
|---|---|
| ASP | Allele-Specific Primer. 대립유전자별 1개, 3′ 말단이 변이 염기 |
| Common / UP | 반대 가닥의 공통(reverse) 프라이머 |
| Tail | ASP 5′에 붙는 FAM/HEX 보편 서열 (21 nt) |
| s1 / s2 / s3 | `[ ]` 앞 flank / 괄호 안 대립유전자 / 괄호 뒤 flank |
| LC% | Linguistic Complexity (서열 어휘 풍부도) |

---

## 1. 입력 파싱

### 1.1 FASTA + 대괄호 마크업
```
>마커명
acgt...flank...[A/G]...flank...acgt
```
- `[A/G]` 이중대립, `[A/C/G/T]` 다중대립, `[R]` IUPAC 1문자, `[AG/]` 또는 `[AG/-]` InDel, `[GATATAC/CAGTCC]` MNV, 하플로타입은 여러 SNP를 한 괄호에.
- 괄호 밖 IUPAC 코드(예 `r`, `y`)는 "주변 SNP"로 취급 → 그 위치는 프라이머가 덮지 않게 마스킹.
- `/.../` 로 감싼 구간은 프라이머 배치 금지 구역.
- 대소문자 무시. A/C/G/T/U + IUPAC(R Y S W K M B D H V N)만 허용, 나머지 문자 제거.
- 헤더 없는 서열은 `Seq1`로 명명. 탭/공백 구분 `이름 서열` 형식도 허용.

### 1.2 IUPAC 확장
`[R]` → `A`,`G` 처럼 가능한 모든 염기 조합으로 전개(곱집합). InDel의 빈 쪽은 빈 문자열(`del`)로 표시.

---

## 2. 서열 전처리(마스킹)

마스크 배열 `mask[i]` (0 = 사용 가능, >0 = 금지)를 전체 서열(s1+allele+s3) 길이로 만든다.

### 2.1 Non-specific priming control (분산 반복서열) — 기본 ON
- k = 15. 서열과 그 역상보 가닥에서 모든 15-mer를 세어, **2회 이상 등장하는 15-mer**가 덮는 위치를 마스킹.
- IUPAC/N 이 포함된 k-mer는 세지 않음.

### 2.2 Low complexity priming control (SSR·텔로미어형) — 기본 ON
- 창 길이 17 nt. 각 창에서 **서로 다른 2-mer + 3-mer 수**를 센다.
- 그 수가 14 미만이면 저복잡도 창. 연속 저복잡도 창이 21 nt 이상 이어지면 블록으로 확정 → 마스킹.

### 2.3 단순반복 즉시 거부(프라이머 단위)
후보 프라이머에 다음 중 하나가 포함되면 즉시 탈락:
`GGGG`, `CCCCC`, `AAAAA`, `TTTTT`, `GCGCGC`, `CGCGCG`, `ATATAT`, `TATATA`

### 2.4 Bisulfite C→T (옵션)
- 정방향: CpG가 아닌 C → T. 역방향: 상보가닥에서 동일 규칙 후 역상보.

---

## 3. Tm 계산 (`reference/tm.js` 참조)

### 3.1 기본 모델
- **SantaLucia 1998 통합 최근접이웃** (ΔH kcal/mol, ΔS cal/mol·K) 16개 쌍 + 개시 항:
  - 말단이 G·C: ΔH +0.1, ΔS −2.8 / 말단이 A·T: ΔH +2.3, ΔS +4.1 (양 말단 각각 적용)
  - 자기상보 서열: ΔS −1.4
- `1/Tm = (ΔS + R·ln(Ct/4)) / ΔH` (R = 1.9872, 비자기상보)

### 3.2 염 보정
- `R_ratio = √[Mg²⁺] / [Na⁺]`
- `Mg = 0` 또는 `R_ratio < 0.22` → **Owczarzy 2004** 1가 양이온 보정
  `1/Tm += (4.29·fGC − 3.95)·10⁻⁵·ln[Na] + 9.40·10⁻⁶·ln²[Na]`
- 그 외 → **Owczarzy 2008** Mg 보정 (R_ratio < 6 이면 a, d, g 계수를 Na 경쟁 보정)
  ```
  1/Tm += a + b·ln[Mg] + fGC·(c + d·ln[Mg]) + (1/(2(N−1)))·(e + f·ln[Mg] + g·ln²[Mg])
  a=3.92e-5 b=−9.11e-6 c=6.26e-5 d=1.42e-5 e=−4.82e-4 f=5.25e-4 g=8.31e-5
  R<6: a*=0.843−0.352√Na·lnNa ; d*=1.279−4.03e-3·lnNa−8.03e-3·ln²Na ; g*=0.486−0.258·lnNa+5.25e-3·ln³Na
  ```

### 3.3 조건 프리셋 (UI 토글, 기본은 바이오니어)
| 프리셋 | Na⁺ | Mg²⁺ | 올리고 | 비고 |
|---|---|---|---|---|
| **바이오니어(기본)** | 50 mM | 0 | 250 nM | 15 nt 미만 Wallace rule `2(A+T)+4(G+C)` |
| primerdigital 비교 | 55 mM | 1 mM | 200 nM | 사이트 값과 대조용 (약 +5~6 °C) |
| 사용자 정의 | 입력 | 입력 | 입력 | |

### 3.4 ⚠ 절대 규칙
- **Tm은 반드시 tail을 제거한 본체 서열로 계산**한다. 출력 표에는 tail 포함 전체 서열과 tail 제외 Tm을 함께 표시.
- Tm 값을 추정하거나 반올림 전에 비교하지 않는다. 소수 1자리.

### 3.5 Amplicon Tm (정보용)
`Tm = 77.1 + 11.7·log10(Na') + 41·(G+C)/N − 528/N`, Na' = [Na] + 3.795·√[Mg] (M). 결과 표의 `Fragment_Size/Tm` 열에만 표시.

---

## 4. 품질 지표

### 4.1 Linguistic Complexity (LC%)
- 서열 길이 N. 관찰 어휘 = 서로 다른 1-mer 수 + 2-mer 수 + 3-mer 수.
- 이론 최대 = `4 + min(N−1, 16) + min(N−2, 64)`.
- `LC% = floor(100 · 관찰 / 최대)`. N < 6 이면 100.
- 기본 하한 70% (UI에서 10~90 조정 가능).

### 4.2 GC%
IUPAC 가중: S/G/C = 1, R/Y/K/M/N = 0.5, B/V = 0.667, D/H = 0.333, A/T/W = 0.

### 4.3 다이머 검사 (self / cross)
- 두 서열의 역평행 상보 정렬을 **5-mer 시드**로 탐색(짧은 쪽의 모든 5-mer 인덱스 → 긴 쪽 역상보 가닥 스캔).
- 시드에서 양방향 확장, **미스매치 1개까지 허용**하며 연속 매치 길이를 센다.
- 매치 길이 ≥ **6**(기본, 6~8 조정)이면 다이머로 판정 → 후보 탈락. 3′ 말단이 걸리거나 ≥8이면 가중치 추가(정보용).
- 사용처: ASP 자기다이머, ASP–ASP, ASP–Common, Common 자기다이머, (allele-sizing) filler–프라이머.

### 4.4 3′-end 패턴
- `N` = 제약 없음. `S`=G/C, `W`=A/T 등 IUPAC 문자열로 마지막 염기 조성 제한.
- 공백으로 여러 패턴 나열(`sws ssw sww wss www`)하면 모두 시도 후 최적 1개 채택.
- Common 프라이머에만 적용(ASP는 3′가 SNP로 고정).

---

## 5. ASP 설계 (대립유전자별)

입력: `snpOffset`(기본 1) = 3′ 말단에서 대립유전자 간에 반드시 달라야 하는 염기 수.

1. 각 대립유전자 문자열 `allele_i + s3` 를 만들고, 길이 `snpOffset` 창을 슬라이딩하며 **대립유전자 간 서로 다른 열(column) 수가 최대**인 위치를 찾는다 → ASP 3′ 말단 좌표 `end`.
   - 단순 SNP + offset 1 이면 `end` = SNP 바로 그 염기.
   - InDel/MNV는 변이 안에서 차이가 가장 큰 자리.
2. 각 대립유전자에 대해 `s1 + allele_i + s3` 에서 `[end−L, end)` 를 잘라 L을 `minLen`부터 늘리며 Tm 계산. **Tm이 [minTm, maxTm] 안에 들어오는 가장 짧은 L**을 채택(없으면 maxLen 에서 중단하고 경고).
3. 변이 구간은 **대문자**, flank는 소문자로 표기.
4. 5′에 tail 부착: tails 목록 순서대로 (FAM → allele 1, HEX → allele 2). 3개 이상 대립유전자면 tail 없음 + 경고.
5. ASP 간 cross-dimer 검사 → 걸리면 `LC=0` 으로 플래그(탈락은 아니고 경고 표시).
6. 출력 ID: `F_{start}-{end}_ASP_{ALLELE}` (reverse 세트는 `R_`).

### 5.1 Reverse 세트
전체 서열의 역상보에 대해 같은 절차를 한 번 더 실행 → 사용자가 Forward/Reverse 두 세트 중 선택.

---

## 6. Common 프라이머 설계

반대 가닥(역상보) 위에서, **3′ flank(s3) 영역 안**에서만 탐색(amplicon ≤ flank 길이).

각 시작 위치 `p` (s3 끝 → SNP 방향)에 대해:
1. 마스크 겹침 검사 — 창 안에 mask>0 이면 건너뜀.
2. 3′-end 패턴 불일치 → 건너뜀.
3. L을 `minLen`부터 늘리며 Tm ≥ minTm 되는 첫 L 채택. Tm > maxTm 이면 탈락.
4. 단순반복(2.3) 포함 → 탈락.
5. LC% < minLC → 탈락.
6. 자기다이머 → 탈락.
7. ASP 각각과 cross-dimer → 탈락.
8. **겹침 처리**: 직전 채택 후보와 위치가 `overlapTol` 미만으로 겹치면 LC 높은 쪽만 남김(`Allow overlapping` ON 이면 모두 유지).
9. 채택: ID `R_{pos}-{pos+L}`, Tm, GC, LC, 좌표.

### 6.1 Amplicon 크기
`size = commonStart + commonLen − 1 − (allele 길이 차 보정) − aspStart + tail 길이`
대립유전자별로 따로 계산해 `A:117 G:117` 형식으로 표시(InDel이면 다름). **권장 50~150 bp, 최대 300 bp** — 범위 밖이면 경고 색.

---

## 7. Allele sizing 모드 (겔 판독, 옵션)
- Tail 탭 비활성. 각 ASP 산물 길이 계산 → 가장 짧은 것을 기준으로 `bandStep`(아가로스 20, PAGE 5, CE 2 bp) 간격 사다리가 되도록 5′에 filler 서열을 붙임.
- filler는 6개 후보 중 모든 프라이머와 다이머가 가장 적은 것 선택(점수 0이면 즉시).
- 옵션 "second deliberate mismatch": 3′에서 2번째 위치(모든 ASP가 같은 염기일 때만)를 상보 염기로 치환. 적용 시 snpOffset=1 강제.
- 최장 프라이머가 `maxLen`(기본 45) 초과 시 경고.

---

## 8. 출력

### 8.1 Report 탭 (모든 후보)
`ID · Sequence(5′→3′) · Length · Tm(°C) · GC(%) · LC(%)`

### 8.2 KASP Assay Sets 탭 (세트)
```
[KASP Forward sets] 마커명:
F_..._ASP_A   GAAGGTGACCAAGTTCATGCTacgt...A   42   58.3   45.0   85
F_..._ASP_G   GAAGGTCGGAGTCAACGGATTacgt...G   42   58.1   45.0   85

R_120-141     ...                            21   59.0   52.4   90   117/78.2
```
- ASP 행: tail 포함 서열, Tm은 **tail 제외** 값.
- Common 행 끝: `Fragment_Size(bp)/Amplicon_Tm`.

### 8.3 내보내기
- TSV 복사, 엑셀(.xlsx, SheetJS) 다운로드 — 시트 2장: `주문용`(Primer Name, Sequence 5′→3′, Direction, Length, Purpose, Scale), `설계근거`(위치 Chr:bp, Tm 조건, 변환 전략, 비고).
- 엑셀 스타일: 헤더 `#0c3026` 배경 + 흰 글씨, 폰트 KoPub Dotum, 틀 고정 A2, 자동 필터.

---

## 9. 기본 파라미터
| 항목 | 기본 | 범위 |
|---|---|---|
| Common 길이 | 18–25 | 12–100 |
| Tm | 57–62 °C | 37–80 |
| ASP 길이 | 18–25 (tail 제외) | |
| ASP–Common Tm 차 | ≤ 3 °C 경고 | |
| snpOffset | 1 | ≥1 |
| 3′-end 패턴 | `n` | |
| min LC | 70 | 10–90 |
| dimer 임계 | 6 | 6–8 |
| Amplicon | 50–150 권장, 300 최대 | |

---

## 10. 인용
- SantaLucia J (1998) PNAS 95:1460–1465. doi:10.1073/pnas.95.4.1460
- Owczarzy R et al (2004) Biochemistry 43:3537–3554. doi:10.1021/bi034621r
- Owczarzy R et al (2008) Biochemistry 47:5336–5353. doi:10.1021/bi702363u
- Kalendar R et al (2022) Front Mol Biosci 9:773956. doi:10.3389/fmolb.2022.773956 (ASQ/KASP 설계 원리)
- Kalendar R (2025) Mol Ther Nucleic Acids 36(4):102716. doi:10.1016/j.omtn.2025.102716 (플랫폼)
- Kalendar R et al (2017) Genomics 109:312–319. doi:10.1016/j.ygeno.2017.05.005 (FastPCR, LC 지표)
