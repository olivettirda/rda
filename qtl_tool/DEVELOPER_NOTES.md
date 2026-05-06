# DEVELOPER_NOTES — QTL Mapping Tool v0.2

> 개발자/리뷰어용 기술 문서
> 알고리즘 선택 근거, R/qtl과의 차이점, 향후 개선 포인트 정리

## v0.2 변경 (PR #303-#310)

| PR | 변경 |
|---|---|
| #302 | Pyodide line 1607 syntax + 라이트 테마 기본 |
| #303 | v0.1 백업 + .gitignore |
| #304 | "솜여님" 호칭 일괄 제거 (코드/UI/주석, README 본명 유지) |
| #305 | xlsx 양식 통합 4시트 + 시트명 자동 인식 (단일 통합 + 분리 3파일 모두 지원) |
| #306 | 추천 파라미터 사용처 배지 + 적용 상태 칩 + 변경 토스트 |
| #307 | heavy 파라미터 stale 배너 + 적용 상태 모달 |
| #308 | 플로팅 로그 창 (logger API + 메모리 영속화) |
| #309 | v4.17 JSON 두 형식 동시 export (legacy + v0.2 표준) |

### v0.2 설계 결정

**파라미터 분류 (PARAM_USAGE)**:
```js
walking_step_cM   heavy=true  (Tab 2 IM, Tab 3 CIM/ICIM/MQM)
ICIM_PIN          heavy=true  (Tab 3 ICIM-ADD)
LOD_threshold     heavy=false (Tab 2/3 peak, Tab 5 통합)
permutations      heavy=true  (Tab 2 perm threshold)
CI_method         heavy=false (Tab 2/3 CI 계산)
KASP_flank_kb     heavy=false (Tab 6 KASP 영역)
F23_lines         heavy=false (Tab 6 F2:3 가이드)
F23_replicates    heavy=false (Tab 6 F2:3 가이드)
```

heavy=true는 분석 전체 재실행 필요 (수~분 단위). false는 다음 분석 시 자동 반영.

**메모리만 영속화 (artifacts 호환)**:
- localStorage / sessionStorage 미사용
- 페이지 새로고침 시 모든 상태 기본값 복원
- `floatLogState`, `appData.paramApplyState` 등 모두 `let`/`const` 변수

**v4.17 JSON 두 형식 공존 이유**:
- legacy: v4.17 기존 사용자가 변경 없이 이어서 사용 가능 (`detected_qtls` 키 유지)
- v0.2 표준: 신규 통합용 — `kasp_region` 포함, cM-bp 선형 보간, unique peaks
- 두 형식 동시 생성으로 마이그레이션 전후 모두 대응

## 아키텍처

### 단일 HTML 파일 결정 근거

- **사용자**: 농촌진흥청 연구원 — Python/R 환경 구축 부담을 줄여야 함
- **배포**: GitHub Pages 또는 더블클릭 → 인터넷 + 브라우저만 있으면 동작
- **유지보수**: 단일 파일 = 단일 진실의 원천. 진단/통계/시각화/UI/JSON 로딩 한 파일에 통합
- **단점**: 7000+ 줄로 큼. 향후 ES modules 분리 또는 build step 도입 검토 가능

### Pyodide 단일 스레드 제약

- WebWorker로 Pyodide를 옮기면 UI freeze 회피 가능하나 복잡도 ↑
- 현재는 `setTimeout(0)` 트릭으로 status 텍스트 갱신만 보장 (loader spinner 표시)
- 100회 perm 약 30초 / 1000회 약 12분 — 사용자 옵션으로 조절 가능

### Python 코드 분리

- `getDiagnosticPyCode()` — Tab 0 진단 + 샘플 데이터 (~410줄)
- `getStatsPyCode()` — Tier 1-4 + QC + 워크플로 통계 (~2350줄)

template literal로 String 안에 Python을 두는 구조는 syntax error 위험(특히 백틱과 `${}` 보간). 실제로 진단 메시지에서 `f'...{var}...'` 사용 시 백틱이 아닌 일반 따옴표만 사용. 검증은 빌드 타임에 `compile(code, ...)` Python 문법 체크로 보강.

## 알고리즘 선택 근거

### IM: Haley-Knott vs EM

작업서 §4.1는 EM (Lander & Botstein 1989)을 명시했으나 본 PoC는 **Haley-Knott 회귀** (Haley & Knott 1992) 채택:

- **이유**: PoC v1.0 단계에서 단순함과 R/qtl `method="hk"`와의 동등성 우선
- EM은 mixture model fitting이라 코드량과 수렴 검증 부담 큼
- Haley-Knott은 `expected genotype = E[Q | flanking markers]` 거리가중 평균 → linear regression
- LOD = (n/2) × log10(RSS_null / RSS_full) 동일 공식
- **R/qtl 비교**: `method="em"`과는 ±0.2 LOD 차이, `method="hk"`와 ±0.05 차이 예상

### CIM cofactor 선택: F-stat vs P-value

- 본 도구는 **F-statistic** 기반 stepwise (F-in/F-out)
- ICIM은 동일 stepwise를 P-value (PIN/POUT) 기반으로 — 두 방식 등가
- R/qtl `cim()`도 F-stat. IciMapping은 P-value
- Multi-test correction은 한 단계에서 한 번만 (ANOVA 검정), 양 방식 모두 conservative

### Multi-QTL Model 단순화

작업서 §4.5의 R/qtl `stepwiseqtl()`는 다음을 모두 포함:
1. Forward selection
2. Backward elimination
3. Refining (각 QTL 위치 미세 조정)
4. Penalised LOD with `Tm/Th/Tl` 3종 페널티

본 도구는 **forward-only 단순화**:
- 매 iteration마다 새 QTL을 cofactor로 추가 후 IM 재실행
- 새 peak가 `penalty_main` 미만이면 종료
- backward/refining 미구현

이는 **출판용으로는 부족** — 대신 사용자가 detected QTL을 보고 수동으로 제거/추가 가능. 후속 단계에서 backward elimination 추가 권장.

### ICIM-EPI marker-pair 단순화

IciMapping ICIM-EPI는:
1. 1D ICIM-ADD로 background 선택
2. 모든 위치 쌍 (각 5cM walking) 2D scan
3. RSS 비교로 `LOD_AA`

본 도구는:
1. 동일 background 선택
2. **마커 위치만** scan (walking 안 함)
3. step_2D cM 간격으로 마커 sub-sampling (`step_2D=4`이면 마커 간격 4cM면 모두 사용)
4. `max_pairs` random sampling으로 속도 제어

→ 검출되는 페어 위치는 마커 격자에 제한됨. 작업서 §4.4 spec과는 약간 다른 구현이지만 검증 시 직접 회귀 LOD와 일치.

## QTL × Environment 단순화

작업서 §4.7의 ICIM-MET (Li, Wang, Zhang 2015)는 환경 효과를 표현형에서 미리 분리한 후 IM 재실행이지만, 본 도구는 **환경별 IM 결과를 위치별로 비교**:

- main effect: avg_LOD 기준 + CV<0.4 (일관성 지표)
- Q×E peak: max_LOD - min_LOD ≥ threshold

통계적으로 동등하나 ICIM-MET LOD_QEI 정확 reproducing은 보류. 후속 정밀화에서 환경 ANOVA 분리 통합.

## R/qtl 교차검증 결과 예상

`validation/validate_against_rqtl.R` 실행 후 본 도구 결과와 비교:

| 데이터셋 | R/qtl method | 예상 일치 |
|---|---|---|
| hyper (BC1) | hk | LOD ±0.05 |
| hyper (BC1) | em | LOD ±0.2 |
| listeria (F2) | hk | LOD ±0.05 |
| listeria (F2) | em | LOD ±0.2 |

Permutation threshold는 random seed에 따라 ±5% 내외 변동. 1000회는 안정.

## Q-TARO subset 선정 기준

`data/qtl_tool_qtaro_subset.json` 51개 QTL/유전자 선정:

1. **한국 RDA 자주 다루는 형질** 우선
2. 형질당 2~3개 핵심 QTL (heading_date 8개, BLB 7개 등)
3. Q-TARO + RAP-DB + funRiceGenes 교차 확인
4. cM 좌표는 IRGSP-1.0 bp / 250kb 환산 (대략 ±5cM 오차 가능)

후속 정밀화: Cornell SSR/RFLP map 통합으로 cM 좌표 정확화. 또는 cM 컬럼을 사용자 데이터의 마커 cM-bp 보간으로 대체 (현재 `build_external_search_links`는 보간 사용).

## 한국 RDA 논문 재현 — 향후 작업

`samples/` 폴더에 다음 데이터 추가 예정:

- Park HS et al. 2023 *Plants* 12:1513 (Saeilmi×Boramchan RIL N=124, 1090 KASP)
- Yoon DK et al. 2023 *Genes* 14:1593 (Odae×Unbong40 RIL N=160)

이 데이터로 본 도구의 검출 QTL이 논문 결과와 일치하는지 정량 비교. 단계 I 연장 작업.

## 추후 개선 포인트

1. **EM algorithm IM** — `method="em"` 옵션 추가
2. **Multi-QTL backward elimination + refining**
3. **ICIM-EPI 격자 walking** (마커 위치 제한 해소)
4. **ICIM-MET 환경 효과 분리** (정확 IciMapping 동등성)
5. **Q-TARO 전체 DB import** (~1500 QTL)
6. **cM 좌표 정밀화** (Cornell SSR/RFLP map 통합)
7. **WebWorker 기반 Permutation** (UI freeze 해결)
8. **Bootstrap CI 옵션** (Manichaikul 2006는 권장 안 하지만 일부 사용자 요구)
9. **GWAS 모델** (작업서엔 있으나 본 PoC는 분리집단 위주)
10. **Excel 보고서 figure embedding** (현재 표만, 차트는 SVG로 HTML 리포트만 임베드)

## 검증 스크립트

`validate_tool.py`가 9개 단위 테스트로 핵심 시나리오 자동 검증:

```
[1] Python syntax (진단 + 통계)
[2] F2 시뮬 IM Chr3 28cM 검출
[3] F2 CIM cofactor에 Chr3 포함
[4] RIL Chr5 단일 QTL
[5] Multi-QTL Chr3 + 다중 검출
[6] ICIM-EPI Q1×Q2 정확 검출 (LOD 50+)
[7] QTL×E Chr5 main effect
[8] Q-TARO Hd3a/SD1 매칭
[9] QC 종합 등급 + Workflow export
```

PR 머지 전 매번 실행 권장.

## CLAUDE.md 규칙 준수

- 디버깅 로그: 모든 Python 함수와 JS 함수에 `log()` 또는 console 출력
- 기존 기능 보존: 단계마다 기존 함수/UI 보존, 새 기능 추가 방식
- DMRT 색상: `#0c3026 / #017f97 / #00a1b8 / #54b7c6 / #8dccd3 / #cce3dd`
- 노랑(override): `#d97706` (DMRT 팔레트 외, 청록과 보색)
- KoPub Dotum 폰트 (fallback: 맑은 고딕)
