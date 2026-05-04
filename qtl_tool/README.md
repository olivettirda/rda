# QTL Mapping Tool v1.0

> 농촌진흥청 국립식량과학원 벼 분자육종 자동화 도구
> 단일 HTML 파일로 동작 — 브라우저만 있으면 됩니다

ICIM(QTL IciMapping), TASSEL, MEGA의 핵심 기능을 통합하되, **"초보자도 파라미터 의미를 이해할 수 있는"** 접근성을 차별점으로 둔 QTL 매핑 도구입니다.

## 차별점

전문툴의 한계: 사용자가 모든 파라미터를 직접 결정해야 하고, 잘못 선택해도 그대로 실행되어 무의미한 결과가 나옵니다.

본 도구의 4가지 차별점:

1. **Diagnostic-First** — 데이터 업로드 시 자동 진단으로 분석 가능 여부와 추천 방법 먼저 제시
2. **Parameter Recommender** — 데이터 4-튜플(집단·N·마커·형질)에서 5개 핵심 파라미터 자동 추천 + 근거 제시
3. **Annotated Visualization** — LOD 곡선·QTL map에 임계선·자동 라벨·해석 텍스트 동반
4. **Workflow Integration** — 검출된 QTL → KASP 마커 설계 등 후속 단계로 직접 연결

## 빠른 시작

### 옵션 A — 정적 호스팅 (권장)

GitHub Pages 등에 `qtl_tool/` 폴더 전체를 호스팅 후 `qtl_tool.html` 열기. JSON 룰셋 자동 로드.

### 옵션 B — 로컬 실행 (Python 서버)

```bash
cd qtl_tool/
python3 -m http.server 8000
# 브라우저에서 http://localhost:8000/qtl_tool.html
```

### 옵션 C — 더블클릭 (제한 모드)

`qtl_tool.html`을 직접 더블클릭하여 열면 동작은 하지만 파라미터 추천 카드가 비활성화됩니다 (브라우저의 file:// fetch 제약).

## 첫 사용 흐름

1. **Tab 0** — 샘플 데이터 버튼(F2/RIL/RIL 다환경) 또는 직접 파일 업로드
2. **▶ 진단 실행** → 집단 유형, 마커 통계, 표현형 통계 + 추천 파라미터 카드
3. **Tab 1** — QC 실행 (분석 전 데이터 품질 검증, 권장)
4. **Tab 2** — 빠른 분석 (SMA + IM + Permutation)
5. **Tab 3** — 표준 분석 (CIM + ICIM-ADD + Multi-QTL Model)
6. **Tab 4** — 고급 분석 (Epistasis 또는 QTL × Environment)
7. **Tab 5** — 결과 통합 + Q-TARO 비교 + Excel/HTML 리포트
8. **Tab 6** — KASP 마커 설계 + F2:3 가이드 + 외부 DB 검색

## 입력 데이터 형식

### 유전자형 (.xlsx / .csv)

첫 컬럼이 마커명, 나머지는 개체. 셀은 `A`/`B`/`H`/`-` 중 하나.

| Marker  | Ind001 | Ind002 | Ind003 | ... |
|---------|--------|--------|--------|-----|
| M01_001 | A      | H      | B      | ... |
| M01_002 | H      | -      | A      | ... |

### 마커 위치 (.xlsx / .csv)

```
Marker | Chr | bp        | cM
M01_001|  1  | 250000    | 1.0
M01_002|  1  | 750000    | 3.0
...
```

### 표현형 (.xlsx / .csv)

첫 컬럼이 개체 ID, 나머지는 형질. 다환경 시 컬럼명에 `_E1`, `_2024`, `_Suwon` 등 패턴이 있으면 자동 감지.

| Indiv  | PlantHeight | GrainYield_E1 | GrainYield_E2 |
|--------|-------------|---------------|---------------|
| Ind001 | 100.5       | 8.2           | 7.9           |
| Ind002 | 95.3        | 7.8           | 8.1           |

## 핵심 파라미터 5개

| 파라미터 | 기본값 | 결정 로직 |
|---|---|---|
| Walking step (cM) | 1.0 | 마커 밀도: 저밀도 2.0 / 중밀도 1.0 / 고밀도 0.5 |
| ICIM PIN | 0.001 | Wang 2009 / IciMapping 표준 |
| LOD threshold | perm 자동 | 1000회 perm으로 α=0.05, floor 2.5 |
| Permutation | 1000 | 탐색 1000 / 출판 10000 |
| CI method | 1.5-LOD | IciMapping default 1-LOD, 출판은 1.5-LOD |

각 파라미터의 (?) 버튼을 누르면 정의 / 단위 / 너무 작/큰 경우 결과 / 한국 RDA 관행 / 원저자 인용을 모달로 확인할 수 있습니다.

사용자가 추천값을 수정하면 노란색(`#d97706`)으로 강조되며, ↶ 복원 버튼으로 추천값으로 즉시 되돌릴 수 있습니다.

## 구현 알고리즘

| Tier | 분석 | 출처 |
|---|---|---|
| 1 | Single Marker ANOVA | F-test + Bonferroni |
| 2 | Interval Mapping | Haley & Knott 1992 (R/qtl `method="hk"`와 동등) |
| 2 | Permutation | Churchill & Doerge 1994 |
| 3 | Composite Interval Mapping | Zeng 1994 |
| 3 | ICIM-ADD | Wang 2009 / Li, Ye, Wang 2007 |
| 3 | Multi-QTL Model | Manichaikul et al. 2009 (단순화) |
| 3 | LOD CI | 1-LOD / 1.5-LOD drop (Manichaikul 2006) |
| 4 | ICIM-EPI | Li, Ribaut, Li, Wang 2008 |
| 4 | QTL × Environment | Li, Wang, Zhang 2015 (단순화) |

## 알려진 제약

- **EM algorithm** 대신 **Haley-Knott 회귀** 사용. 통계적으로 동등하나 R/qtl `method="em"`과는 LOD가 ±0.2 정도 차이날 수 있습니다 (작업서 §2.2 후속 정밀화).
- ICIM-ADD는 **Hadamard residual 변환** 대신 위치별 회귀에 background 포함. 통계적으로 동등하나 IciMapping 출력과 정확 일치는 보류.
- Multi-QTL은 **forward-only 단순화 버전** — backward elimination/refinement 미구현.
- ICIM-EPI는 **marker-pair 검정**만 — step_2D cM 격자 walking은 후속.
- Permutation은 Pyodide 단일 스레드 — 1000회 약 12분, 200회 약 1분 권장.

## 기술 스택

- **Pyodide 0.26.2** — Python 통계 분석을 브라우저에서 실행
- **Plotly 2.35.2** — 인터랙티브 시각화
- **XLSX.js (SheetJS) 0.18.5** — 엑셀 파일 처리
- 모든 의존성 CDN 로드 (사용자가 별도 설치 불필요)

## 폴더 구조

```
qtl_tool/
  qtl_tool.html                          ← 단일 HTML (Pyodide+Plotly+XLSX)
  data/
    qtl_tool_rules.json                  ← 룰셋 (12개 키, 마커 밀도/집단/형질별)
    qtl_tool_param_descriptions.json     ← Parameter Coach 설명 (11개 파라미터)
    qtl_tool_qtaro_subset.json           ← Q-TARO 핵심 51개 QTL/유전자
  validation/
    validate_tool.py                     ← Python 단위 테스트
    validate_against_rqtl.R              ← R/qtl 교차검증 가이드
  samples/                               ← 샘플 데이터 (.csv)
  README.md                              ← 사용자 매뉴얼 (이 파일)
  DEVELOPER_NOTES.md                     ← 개발자 노트
```

## 검증

```bash
python3 qtl_tool/validation/validate_tool.py
```

자동 단위 테스트:
- F2/RIL 시뮬레이션의 알려진 QTL 위치 정확 검출
- 다중 QTL Multi-QTL Model
- ICIM-EPI digenic interaction
- QTL × Environment 다환경 분류
- Q-TARO 매칭 (Hd3a, SD1 등)
- QC 종합 등급
- 워크플로 export

## 참고문헌

- Lander ES & Botstein D (1989) *Genetics* 121:185-199
- Haley CS & Knott SA (1992) *Heredity* 69:315-324
- Churchill GA & Doerge RW (1994) *Genetics* 138:963-971
- Zeng Z-B (1994) *Genetics* 136:1457-1468
- Beavis WD (1998) — PVE inflation
- Li H, Ye G, Wang J (2007) *Genetics* 175:361-374
- Li H, Ribaut J-M, Li Z, Wang J (2008) *TAG* 116:243-260
- Wang J (2009) *Acta Agronomica Sinica* 35:239-245
- Manichaikul A et al. (2009) *Genetics* 181:1077-1086
- Li S, Wang J, Zhang L (2015) *PLOS ONE* 10:e0132414

## 라이선스 / 출처

- 본 도구: 농촌진흥청 국립식량과학원 (이소명, LEE SOMYUNG)
- Q-TARO 좌표 출처: vegetable.naro.go.jp/qtaro, RAP-DB, funRiceGenes
- 참조 게놈: IRGSP-1.0
