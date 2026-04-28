# prompt_logic_2.md — 출품 도구 5종 데이터 흐름

각 도구 4단계(입력 → 전처리 → 핵심 처리 → 출력). grep 으로 `accept=`, `input type=file`, `upload`, `export`, `download`, `XLSX/CSV` 키워드만 확인. 추측 금지.

---

## 1. createphenotypingform.html
- **입력**: Excel `.xlsx/.xls` 3종 — 품종목록(`#excelFile`), 조사양식 템플릿(`#surveyExcelFile`), 조사값 데이터(`#dataFile`). 직접 입력 행 추가도 가능 (설정/품종/조사항목/배수설정 시트).
- **전처리**: SheetJS 로 시트별 파싱(`설정`, `품종목록`, `조사값`, `배수설정`), 배수설정 적용해 단위 변환, 결측·이상치는 ANOVA 분산 계산에서 제외.
- **핵심 처리**: 형질별 기술통계(평균/SE/CV/IQR/왜도/첨도) → ANOVA(F검정, F<sub>crit</sub> 비교) → DMRT(Duncan q-table α=0.05/0.01) 그룹문자(a,b,c…) 부여 → Chart.js 시각화.
- **출력**: 엑셀 리포트(`downloadExcelReport`), 차트 PNG ZIP(`downloadAllChartsZip`), 전체 ZIP(`downloadFullResultsZip`), 바코드/QR A4 라벨 PDF(html2canvas+jsPDF, 13.5mm 패딩), CSV(`downloadListCSV`).

## 2. background_selection_v3.HTML
- **입력**: 마커 데이터 CSV/TSV/TXT/XLSX (`#markerFile accept=".csv,.tsv,.txt,.xlsx,.xls"`), 게놈빌드·도너/리커런트 부모 선택, 데모 데이터(`loadDemoData`).
- **전처리**: 텍스트는 PapaParse, 엑셀은 SheetJS 로 파싱. Missing(`'-'`, `'NN'`) 마커는 총 마커 수에서 제외, 염색체 번호 `padStart(2,'0')` 정규화, 위치(bp) 기준 정렬.
- **핵심 처리**: `analyzeRecovery()` — 샘플별·염색체별 recurrent 일치 비율 계산, recoveryRate(기본 임계 95%) 로 PASS/FAIL 판정, 동원체 위치 기반 염색체 시각화 + Chart.js 회복률 차트.
- **출력**: 통계 CSV(`exportCSV`), 원시데이터 CSV(`exportRawDataCSV`), 차트 PNG/SVG(`exportAllCharts`, exportDPI 옵션), 일괄 ZIP(`openBulkExportModal`), 염색체별 PNG.

## 3. rice_breeding_v5_0.html
- **입력**: 유전자형 엑셀(`#genotypeFileInput`), 표현형 엑셀(`#phenotypeFileInput`), 연관지도 CSV/엑셀(`#linkageFileInput`), 메인 업로드 영역(`#fileInput .xlsx,.xls`) + 드래그앤드롭.
- **전처리**: SheetJS 파싱, `chromosomeInfo` 상수로 bp→cM 변환(`convertBpToCm`, 동원체 억제계수 0.1/0.5/0.7/1.0 적용), 마커 cM 정렬, QC(MAF/결측 임계).
- **핵심 처리**: Kosambi 지도함수(`0.5*tanh(2*cM/100)`)로 재조합률, F1→SSD 세대 진전 시뮬레이션, NSGA-II Pareto 다목적 최적화(교배·돌연변이 0.1, 비지배 정렬, 상위 10), Q-Learning 전략 추천.
- **출력**: 검수 리포트(`downloadQcReport`), 결과 Excel(`grbExportExcel`), 리포트+그래프 ZIP(`downloadReportAndGraphsZip`), 염색체 페인팅 PNG, 로그(`exportLog`).

## 4. kasp.html
- **입력**: 시료 목록 Excel/CSV (`#sampleInput .xls,.xlsx,.csv`, Well Position+품종명), KASP raw 결과 Excel 다중 업로드(`#rawDataInput .xls,.xlsx multiple`).
- **전처리**: SheetJS 로 `Results` 시트의 `Well` 헤더 행 자동 탐지, FAM/HEX 형광값 파싱, 파일명에서 유전자명 추출(`baseName`), Well-Position ↔ Sample 매핑.
- **핵심 처리**: `findDistributionThreshold()` 로 FAM/HEX 분포 자동 임계(하위 40% 최대 gap, min 0.03), 사용자 임계의 80% 미만이면 0.9× 자동 보정, Ratio 기반 CK1/CK2/HET/UND 분류, Cluster 산점도 시각화 + 수동 보정 모달.
- **출력**: 결과 Excel(`downloadExcelBtn`), CSV(`downloadCsvBtn`), 산점도 차트 (DOM 시각화).

## 5. label_printer.html (label 레포)
- **입력**: 본 워크스페이스 미접근(`/home/user/rda` 에 파일 없음). 검증 불가.
- **전처리**: 동상 — 실제 코드 확인 불가.
- **핵심 처리**: 동상 — 실제 코드 확인 불가.
- **출력**: 동상 — 실제 코드 확인 불가. (createphenotypingform 의 `barcode-label-container` A4 13.5mm 패딩 / 64×34mm 3×8 그리드 레이아웃이 동일 규격일 가능성 있으나 별도 검증 필요)
