# prompt_logic_1.md — 출품 도구 5종 핵심 알고리즘·계산식·하드코딩 상수

추출 방법: `grep` 으로만 핵심 키워드(Tm/Wallace/SantaLucia, Kosambi, DMRT/Duncan, NSGA/pareto, padding/13.5mm, centromere/동원체) 매칭 라인 확인. 파일 전체 읽기 없이 실제 코드에 박혀 있는 것만 기록.

| 도구 | 파일·함수명 | 알고리즘 / 계산식 | 출처 (file:line) |
|---|---|---|---|
| createphenotypingform | `qTable` 상수 (Duncan's q값 테이블, α=0.05 / 0.01) | DMRT 임계 q-값 룩업 테이블 (df=1,2,…120 × p=2,…11). 예: α=0.05, df=10 → `[0,3.151,3.293,3.376,3.430,3.465,3.489,3.505,3.516,3.522]` | createphenotypingform.html:1390-1418 |
| createphenotypingform | `performDMRTForTrait()` / `getQValue(df,p,alpha)` | ANOVA F검정 → Duncan's Multiple Range Test. 평균 차이 vs `qVal × √(MS_W/n)` 비교로 그룹 문자(a,b,c…) 부여 | createphenotypingform.html:3064-3187, 3124-3148, 3403-3426 |
| createphenotypingform | `.barcode-label-container` (라벨 인쇄 CSS) | A4 (210×297mm) 레이아웃, `padding: 13.5mm 5mm 14mm 6.5mm`; 라벨 그리드 `repeat(3, 64mm) × repeat(8, 34mm)`, 21칸 모드 `34mm→39mm × 7행`, gap `0 2mm` | createphenotypingform.html:135-137, 181-189 |
| background_selection_v3 | `analyzeRecovery(sample, donor, recurrent)` | 마커별 sample/donor/recurrent 유전형 비교 → recurrent 일치 카운트. `recoveryRate = recurrentMarkers / totalMarkers × 100`, 염색체별 동일 산식 | background_selection_v3.HTML:2836-2916 |
| background_selection_v3 | `recoveryThreshold` (PASS/FAIL 컷오프 슬라이더) | 기본값 `95%`, 범위 80–99%. `isPass = recoveryRate ≥ threshold` 로 합/불 판정 | background_selection_v3.HTML:1338, 3243-3250 |
| background_selection_v3 | 동원체(centromere) 시각화 상수 | `--viz-centromere: #0c3026; --viz-centromere-w: 8px;` (단완·장완 사이 원형 마커). donor=`rgba(1,127,151,0.7)`, recurrent=`rgba(204,227,221,0.9)` | background_selection_v3.HTML:22-26, 312-330 |
| rice_breeding_v5_0 | Kosambi 지도함수 (`distance_cM` → 재조합률) | `recombRate = 0.5 * Math.tanh(2 * distance_cM / 100)` — F2/SSD 세대 진전 시뮬레이션의 핵심 식 | rice_breeding_v5_0.html:3028-3029, 12425 |
| rice_breeding_v5_0 | `chromosomeInfo` (Os-Nipponbare 12 염색체 상수) | 각 염색체 `size_bp / centromere_start / centromere_end / size_cM / ratio` 하드코딩. 예: Chr1 `size_bp:43270923, cen:16610866-17243770, size_cM:182.4, ratio:237200`. 동원체 억제: ≤750kb=0.1, 750kb-2Mb=0.5, 2-3Mb=0.7, >3Mb=1.0 (cM/Mb ≈ 0.05/0.25/0.35/0.5) | rice_breeding_v5_0.html:1739-1750, 664-666 |
| rice_breeding_v5_0 | NSGA-II Pareto 다목적 최적화 (`dominates()`, `pareto_front`) | Python 인라인: 토너먼트→교배(`crossover`)→돌연변이(`mutate, prob=0.1`)→비지배 정렬. `dominates(f1,f2)`: 모든 목표 ≥ AND 한 개라도 > 일 때 지배. 최종 `pareto_front` 적합도합 내림차순 → 상위 10개 반환 | rice_breeding_v5_0.html:4960-5074 (특히 4972-4982, 5060-5074) |
| kasp | `findDistributionThreshold(values)` | 히스토그램 자동 임계: 정렬 후 하위 40% 구간(`Math.floor(n*0.4)`)에서 인접 값 차이가 가장 큰 지점(단, gap > 0.03) 을 음성/양성 컷오프로 채택 | kasp.html:1165-1180 |
| kasp | 자동 임계 보정 로직 (HEX/FAM minimum) | `if (distMin < userThreshold * 0.8) → threshold = round(distMin * 0.9 * 1000)/1000`. 즉 분포 기반 추정값이 사용자 입력의 80% 미만이면 추정값의 90%로 자동 하향 (소수 셋째자리) | kasp.html:1373-1378 |
| kasp | KASP 유전형 색상·클래스 코드 | `--ck1`(homozygous A1), `--ck2`(homozygous A2), `--het:#7b1fa2`(이형접합), `--und`(미판정). 셀 배경: geno-1 `#e3f2fd`, geno-0 `#fff3e0`, geno-H `#f3e5f5`, geno-X `#eeeeee` | kasp.html:41, 557-561 |
| label_printer | (label 레포 — 본 워크스페이스 미접근) | 파일 미발견. `find /home/user -iname label_printer.html` 결과 0건. 검증 불가하여 추측 기재 안 함 | (N/A) |
| label_printer | (동상) | 동상 — `padding/13.5mm`, GS1, JsBarcode/QRCode 등 키워드 검증 불가 | (N/A) |
| label_printer | (동상) | 동상 — 라벨 템플릿(64mm×34mm 등) 검증 불가 | (N/A) |

## 메모

- **label_printer.html** 은 별도 `label` 저장소에 위치한다고 명시되어 있으나 현재 작업 환경(`/home/user/rda`)에서는 발견되지 않아 3행은 N/A 처리. 추측 금지 규칙 준수.
- createphenotypingform.html 에 라벨 인쇄(`barcode-label-container`, `13.5mm` 패딩) 코드가 함께 존재하므로 label_printer 와 같은 라벨 규격(A4 / 64×34mm 3×8 / 64×39mm 3×7)이 동일하게 사용될 가능성 있음 — 별도 검증 필요.
- NSGA-II 키워드는 `background_selection_v3.HTML` 에는 없고 `rice_breeding_v5_0.html` 의 Python 인라인 블록(Pyodide 추정)에 위치.
- Kosambi 식은 `rice_breeding_v5_0.html` 두 곳(3029, 12425)에서 동일하게 등장.
