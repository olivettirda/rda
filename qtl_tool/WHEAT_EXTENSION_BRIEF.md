# 밀 QTL 분석 도구 확장 설계 — 농진청 밀 육종가용 통합 리서치 보고서

> 벼 QTL 도구(v4.16/v4.17, 87.2% 표현형 예측 정확도, Pyodide+Plotly+XLSX.js 단일 HTML)를 밀로 확장하기 위한 구체적 권장사항입니다.
>
> **핵심 결론**:
> 1. **Ensembl Plants REST + T3/Wheat BrAPI v2** 두 API만이 CORS `*` 지원으로 브라우저에서 직접 호출 가능하며, 나머지 DB는 사전 ETL 후 정적 호스팅이 필수입니다.
> 2. **webR(R/qtl2 wasm 빌드 확인됨)**을 Pyodide와 동시 로드하면 CIM/MQM/HK regression을 즉시 활용할 수 있습니다.
> 3. 한국 환경 적응성 핵심 QTL은 **qDH-3A(출수기), qPC-3A(단백질), NAM-B1, Fhb1(PFT_KASP), Tamyb10, TaMKK3-A**이며 이들을 default 패널로 우선 노출해야 합니다.
> 4. 현재 35K Wheat Breeders' Array는 Illumina가 아닌 **Affymetrix Axiom** 플랫폼이라는 점도 task 명세에서 정정이 필요합니다.
> 5. 14.5Gb 게놈은 청크 로딩(IndexedDB+OPFS)+Web Worker+Apache Arrow로 메모리 100MB 이내 운용이 가능합니다.

---

## 1. 밀 특화 유전체/마커 DB 통합 (최우선)

### 1.1 CORS 통과 기준 즉시 통합 가능 DB

브라우저 단일 HTML에서 실시간 fetch가 가능한 DB는 **Ensembl Plants REST API**(`rest.ensembl.org`, Release 62 [2025-09], `Access-Control-Allow-Origin: *` 명시 지원)와 **T3/Wheat BrAPI v2**(`https://wheat.triticeaetoolbox.org/brapi/v2/`, breedbase 기본 CORS 허용) 둘 뿐입니다. 이 두 API만으로 유전자 lookup, 변이 조회(Axiom 35K/820K, TaNG, Watkins exome, WRC KASP 710개), VEP, germplasm/trial 메타데이터의 약 80%를 충족할 수 있습니다. Ensembl Plants는 **두 어셈블리를 동시 호스팅**(`Triticum_aestivum`=v1.0, `Triticum_aestivum_refseqv2`=v2.1) 하므로 좌표 변환 작업이 줄어듭니다.

### 1.2 사전 ETL 후 정적 호스팅이 필요한 DB

**CerealsDB**(35K/820K/KASP 99,945개), **GrainGenes**(USDA 50+ JBrowse + MASWheat 호스팅), **WheatQTLdb V2.0**(27,518 QTL + 1,321 metaQTL + 202 epistatic, Singh 2022), **WheatOmics 1.0**(WheatPanache 16-genome pangenome, Ma 2021), **URGI Wheat@URGI**(IWGSC RefSeq v2.1 다운로드)는 모두 CORS 헤더 미설정이거나 HTTP만 지원하므로 mixed-content 차단 위험이 있습니다.

권장 워크플로우:

```
원본 → 1회 서버측 ETL → {
  chr별 GFF3 → BGZF .json.gz (1Mb bin),
  변이 VCF → Parquet + manifest,
  QTL/MTA → 단일 통합 JSON (~5MB gzip),
  KASP/Axiom → Apache Arrow IPC
} → CDN/S3/GitHub Pages 정적 호스팅
   → HTML 도구가 IndexedDB 캐싱 + Web Worker로 처리
```

### 1.3 한국 데이터 접근

**RDA Genebank OpenAPI**(genebank.rda.go.kr)는 인증키 발급 후 사용 가능하나 키 노출 위험으로 브라우저 직접 호출 불가 → 백엔드 프록시 또는 사전 데이터 덤프가 필수입니다. **NICS**(nics.go.kr)는 표현형 데이터를 보유하나 게놈 변이 DB는 미공개 상태입니다. 한국 분자 마커 자료는 **KWSM001-015** 등 SCAR/HRM/SNP 마커가 41개 국내 품종을 식별하며(Park et al. 2022, PMC8994797 = 7 cv plastome ASP/TaqMan), 이는 학술논문 보충자료에서 수동 JSON화하여 도구에 임베드하는 것이 현실적입니다.

### 1.4 14.5Gb 게놈 메모리/연산 최적화

벼 대비 37배 큰 게놈을 Pyodide(~2-4GB wasm 메모리 한계) 환경에서 다루려면 **3계층 데이터 분리**가 핵심입니다:

- **Index level** — 21 chr 시작/끝, gene density bin, QTL summary, 단일 JSON ≤5MB 즉시 로딩
- **QTL/Marker level** — 염색체별 5-50MB 압축 청크 요청 시 로딩
- **Sequence level** — IndexedDB 캐시 또는 Ensembl REST `/sequence/region/` 호출

저장은 **Apache Arrow/Parquet**(columnar, dictionary encoding으로 0/1/2 SNP 매우 효율적) 또는 **PLINK BED 비트팩킹**(4 genotype/byte → 820K×1000=205MB), 압축은 **Zstandard-wasm**(gzip 대비 2-5배 빠른 디코딩) 또는 **BGZF+tabix**(random access)가 권장됩니다. **사용자가 한 번에 보는 영역은 보통 ≤10Mb이므로 bin/range lazy loading으로 활성 메모리 100MB 이내 유지가 가능합니다.**

### 1.5 DB 통합 우선순위 표

| 순위 | DB | URL | API/CORS | 통합 시점 |
|---|---|---|---|---|
| 1 | Ensembl Plants Wheat | rest.ensembl.org | REST, CORS `*` | 즉시 |
| 2 | T3/Wheat BrAPI v2 | wheat.triticeaetoolbox.org/brapi/v2 | BrAPI, 허용 | 즉시 |
| 3 | MASWheat 마커 메타 | maswheat.ucdavis.edu | 정적 HTTPS, 가능성 | 즉시 (수동 JSON) |
| 4 | WheatQTLdb V2.0 | wheatqtldb.net | 미설정 | 단기 (스크래핑) |
| 5 | CerealsDB 35K/820K | cerealsdb.uk.net | 미설정 | 단기 (Parquet 변환) |
| 6 | GrainGenes QTL/marker | wheat.pw.usda.gov | 부분 BrAPI | 단기 |
| 7 | IWGSC RefSeq v2.1 | urgi.versailles.inrae.fr | FTP만 | 단기 (자체 호스팅) |
| 8 | WheatOmics pangenome | wheatomics.sdau.edu.cn | 없음, HTTP | 중기 |
| 9 | 1062 wheat genomes | NCBI SRA (Zhou 2023) | 없음 | 중기 |
| 10 | RDA Genebank | genebank.rda.go.kr | OpenAPI(키 필요) | 중기 (프록시) |

---

## 2. 다중 입력 형식 자동 감지 시스템

### 2.1 형식별 핵심 식별 패턴

**Illumina iSelect 90K/15K Wheat (Wang 2014)** — GenomeStudio Final Report는 `[Header]`+`GSGT Version` 매직 라인과 `SNP Name`+`Sample ID`+`Allele1 - Top`+`Allele1 - AB`+`GC Score`+`Theta` 컬럼으로 식별. Marker prefix는 `IWB-`, `BS00`(CerealsDB Bristol), `wsnp_<src>_c<contig>_<pos>`, `Excalibur_c*`, `Kukri_c*`, `RAC875_c*`, `BobWhite_c*`, `Tdurum_*` 등이며 `Num SNPs ≈ 12908`이면 15K, ≈81587이면 90K로 자동 분류합니다. 90K → IWGSC RefSeq v2.1 매핑은 **57,398 markers** 가용(Cao 2022, PMC9494784).

**Affymetrix Axiom 35K/820K** — task 명세에 "Illumina 35K"로 표기되어 있으나 **35K Wheat Breeders' Array는 Affymetrix Axiom 플랫폼**(Allen 2017)이며 `probeset_id` 헤더와 `^AX-\d{8}` prefix로 식별. AX- ID 범위로 35K/820K/TaNG를 lookup하여 자동 분류합니다. Cluster 위치 기반 AA/AB/BB는 ref/alt allele와 다를 수 있어 **반드시 lookup table을 동반**해야 sub-genome A/B/D ↔ allele A/B 혼동을 방지할 수 있습니다.

**DArTseq** — `silicoDArT`(dominant 0/1)와 `SNP`(codominant 0/1/2 또는 2-row) 두 출력. CSV는 6줄 topskip + `CloneID` + `AlleleSequence` 헤더가 magic. CIMMYT 표준 가이드(data.cimmyt.org/dataset.xhtml?persistentId=hdl:11529/10548358) 및 dartR `gl.read.dart()` 로직 포팅이 권장됩니다.

**GBS HapMap/VCF** — `rs#`+`alleles`+`chrom`+`pos`+`strand`+`assembly#` 헤더와 `S<chr>_<pos>` TASSEL 자동생성 ID. **GBS는 보통 30-80% missing**이므로 사전 imputation(Beagle 5/LinkImpute) 권장 메시지가 필수입니다. 표준 VCF v4.2는 `##fileformat=VCFv4`+`##contig=<ID=Chr1A,length=...>` 라인으로 RefSeq 버전 식별.

**KASP** — LGC KlusterCaller XLSX는 `MasterPlate`/`SubjectID` 헤더 + 셀값 `X:X`/`Y:Y`/`X:Y`/`NTC`로 식별. SNPViewer raw는 FAM/HEX/ROX 형광값 + Call 컬럼. 변환은 X:X→A, Y:Y→B, X:Y→H, NTC/Failed/?→`-`.

### 2.2 자동 감지 알고리즘 (Tier 우선순위)

```
Tier 1: 매직 라인 (##fileformat=VCF / [Header]+GSGT / rs#+alleles)
Tier 2: 헤더 컬럼 정확 매칭 (probeset_id ⇒ Axiom; CloneID+topskip 6 ⇒ DArT)
Tier 3: 마커 ID prefix 정규식 200행 샘플링 가중 투표
Tier 4: 셀 값 패턴 (X:X/Y:Y ⇒ KASP; AA/AB/BB ⇒ chip; 0/1/2 ⇒ numeric; IUPAC 단일자 ⇒ HapMap)
Tier 5: 사용자 수동 override
```

### 2.3 통일된 내부 표현

모든 형식은 `matrix[sample, marker] ∈ {A, B, H, -}` + 마커명 `Chr<1-7><A|B|D>_<position(bp)>` (IWGSC RefSeq v2.1 좌표) 형식으로 정규화합니다. 90K marker 중 **D-genome coverage가 매우 낮음(≈2,627/57,398)** → D-genome QTL 검출력 제한이 inherent하며 도구가 사용자에게 경고해야 합니다. v1.0 입력은 Liftoff(Sehgal 2023, PMC10503198, 2,946,536/3,039,822 = 96.9% concordant) 기반으로 client-side 변환합니다.

### 2.4 입력 형식 매트릭스

| 형식 | 확장자 | Tier | Marker prefix | 변환 |
|---|---|---|---|---|
| 90K Final Report | .txt/.csv | 2 | IWB/BS00/wsnp_/Excalibur_/Kukri_/RAC875_ | AB→A/B/H/- |
| 15K Final Report | .txt/.csv | 2 | 90K subset | 동일 |
| Axiom 820K calls | .calls.txt/.vcf | 2 | AX-\d{8} (820K range) | AA/AB/BB → A/H/B |
| Axiom 35K calls | .calls.txt | 2 | AX- (35K subset) | 동일 |
| DArTseq SilicoDArT | .csv | 2 | \d+\|F\| | 1→A, 0→B |
| DArTseq SNP | .csv | 2 | \d+\|F\|\d+-[ACGT]>[ACGT] | 0/1/2 → A/H/B |
| HapMap | .hmp.txt | 2 | S\d[ABD]_\d+ | IUPAC + REF→A/ALT→B |
| VCF | .vcf(.gz) | 1 | rsID 자유 | 0/0→A, 1/1→B, 0/1→H |
| KASP grid | .xlsx/.csv | 2 | KASP_/wMAS/Vrn-/Rht-/Fhb/Ppd- | X:X→A, Y:Y→B, X:Y→H |

---

## 3. 통계 방법 및 기술 스택

### 3.1 핵심 발견 — webR이 게임체인저

**R/qtl2의 WebAssembly 바이너리(`qtl2_0.39-2.tgz r-4.5-emscripten`)가 r-universe(rqtl.r-universe.dev)에 이미 빌드되어 있어 webR로 즉시 사용 가능합니다.** webR + Pyodide 동시 실행은 hrbrmstr/webr-pyodide 사례와 Posit Quarto Live가 검증한 패턴이며, 두 환경은 별도 Emscripten VFS를 갖되 JS 메인 스레드 또는 OPFS 공유 파일을 통해 데이터 교환이 가능합니다.

권장 분담:
- **Pyodide** = SMA/MLM/FarmCPU/BLINK 자체 구현 + scikit-learn ML
- **webR** = CIM/MQM/HK regression/LMM scan
- **JS** = UI+OPFS+XLSX+Plotly

### 3.2 방법별 구현 가능성

90K SNP × 500 시료(~4500만 셀, int8=45MB) 기준 Pyodide WASM은 네이티브 대비 2-5배 느립니다.

| 방법 | 시간 | 구현 |
|---|---|---|
| SMA (scipy.stats 벡터화) | 5-20초 | 즉시 가능 |
| IM (EM 자체구현) | 1-5분 | Pyodide |
| CIM (window=10cM) | 5-15분 | **webR R/qtl `cim()` 권장** |
| MLM/EMMAX (kinship + REML) | 30초+10-30분 | numpy.linalg + 자체 REML |
| FarmCPU/BLINK | 3-15분 | statsmodels OLS 반복 |
| ICIM | 자체 재구현 | IciMapping 폐쇄형이므로 회귀 테스트 필수 |
| Bayesian (BayesB/C/R, BSLMM) 10K Gibbs | 1-3시간 | webR + BGLR |

**limix는 C++ 확장으로 Pyodide 미지원**, **PyTorch/TF는 Pyodide 풀 빌드 미존재** → TensorFlow.js 또는 ONNX-Web을 통한 사전 학습 모델 추론만 권장.

### 3.3 저장·렌더링 스택

저장은 **OPFS(Origin Private File System)가 IndexedDB의 3-4배 빠르며 Web Worker 내 sync API**로 수 GB까지 사용 가능합니다. 메모리 형식은 **Apache Arrow IPC**(Pyodide↔JS 제로카피), 영속화는 **Parquet+Snappy/Zstd**(90K×500 → ~10-15MB)가 최적. **SharedArrayBuffer는 COOP/COEP 헤더 필요**이므로 GitHub Pages 같은 정적 호스팅에서는 **Comlink + 다중 Worker + postMessage transferable 패턴으로 우회**합니다.

시각화는 **Plotly scattergl이 1차 선택(≤50K 점)**이지만 100K 이상 호버는 저하되므로 **regl-scatterplot 또는 OffscreenCanvas로 백만 SNP 풀 표시**를 보조합니다.

### 3.4 권장 아키텍처 (텍스트 다이어그램)

```
[Main Thread]   UI + Plotly + XLSX.js + Comlink RPC
       │
   ┌───┼────┬──────────────┬───────────────┐
   ▼   ▼    ▼              ▼               ▼
[Pyodide Worker]  [webR Worker]      [OPFS Worker]
 numpy/scipy      qtl(CIM,MQM)       SyncAccessHandle
 statsmodels      qtl2(HK,LMM)       geno.parquet
 sklearn          BGLR(옵션)         pheno.parquet
 SMA/MLM/         Emscripten R libs  results/
 FarmCPU/BLINK
       ↕ Apache Arrow IPC / Transferable ArrayBuffer
[Persistence] OPFS(geno/pheno/kinship) + IndexedDB(meta) + LocalStorage(UI)
[옵션] COOP/COEP 헤더 시 SharedArrayBuffer + multi-thread BLAS
```

---

## 4. 논문급 시각화 — 색상·DPI·폰트 표준

### 4.1 Manhattan plot의 sub-genome 색조

밀 21 염색체는 **1A-1B-1D-2A-...-7A-7B-7D 순서 + homoeologous group 묶음**이 표준이며, sub-genome은:

- **A = 따뜻한 계열** (#E64B35, #F39B7F)
- **B = 청록** (#4DBBD5, #00A087)
- **D = 보라/회색** (#8491B4, #B09C85)

로 차별화하면 Wong/Okabe-Ito 색맹 안전 팔레트와 호환됩니다. 임계선은 **Bonferroni(빨간 실선) + FDR B-H(점선) + 1,000 permutation 경험 임계값(회색 점선)** 3종 동시 표시가 관행입니다. 라벨 충돌은 d3-force/labella.js로 ggrepel 스타일 회피하며 5-7pt + 0.5pt leader line.

### 4.2 출력 사양 표준

**SVG/PDF 벡터 우선, raster는 학술지 line art 600-1200 DPI**(Genetics 600, Cell 500 B/W, Science 1200), **사진 결합은 300-500 DPI**입니다. 컬럼 폭은 **single 88mm(Nature)/85mm(Cell), double 180mm(Nature)/174mm(Cell)** preset을 제공해야 합니다. 폰트는 **영문 Arial/Helvetica + 한글 KoPub Dotum/Batang(SIL OFL, 출판 가능)** 또는 본고딕(Noto Sans CJK KR), 라벨 5-7pt, 축 제목 8-9pt, 패널 라벨 10-12pt. **선 굵기 0.25pt 이상**(인쇄 시 사라짐 방지), CMYK 시뮬레이션 미리보기 토글 권장.

### 4.3 흑백·색맹 안전 이중 인코딩

**색상이 사라져도 식별 가능하도록 점 모양(circle/square/triangle/diamond/cross)·라인 패턴(solid/dash/dot/dashdot)·hatching 패턴을 동시에 적용**합니다. Grayscale은 ColorBrewer Greys 9-class(#f7f7f7→#252525), 컬러는 Okabe-Ito 8색 + Paul Tol qualitative만 사용하며 rainbow/jet/red-green 조합은 금지합니다. DMRT 컬러칩(#0c3026/#017f97/#00a1b8/#54b7c6/#dc3545)은 CMYK 안전하지만 #dc3545(red)와 #017f97(teal)는 색맹 시 구분 어려움이 있어 **차트에는 Okabe-Ito 매핑** 후 UI 테마에만 DMRT 적용을 권장합니다.

### 4.4 7-Step Wizard와 i18n

Galaxy/T3 Wizard 패턴 참조:

1. 데이터 업로드 drag&drop
2. 자동 감지 결과 + missing/MAF/segregation distortion 검증
3. Population type(F2/RIL/DH/BC/MAGIC/diversity) 선택
4. 분석 방법(IM/CIM/ICIM/GLM/MLM/FarmCPU/BLINK)
5. 매개변수(LOD/permutation/kinship/PCA)
6. 시각화
7. 보고서 출력

ⓘ 툴팁은 Churchill & Doerge 1994 등 학술 근거 모달 링크를 제공하고, 첫 실행 시 Shepherd.js onboarding tour가 권장됩니다. i18next JSON 사전으로 한국어/영어 토글, 한국 작물학회 용어집 기반 표준화(QTL=양적형질 좌위, LOD=상대적 가능성 로그값, MAS=분자표지 도움 선발).

---

## 5. 한국 밀 육종 특화 콘텐츠

### 5.1 한국 환경 적응성 default 패널

농진청 530점 core collection 5년 평가(Lim 2025, PLoS ONE)에서 **한국 품종은 VRN-A1/PPD-A1/PPD-D1이 거의 fixed**(single-copy vrn-A1 + Ppd-D1a)로 기존 출수기 유전자만으로는 한국 내 변이 설명이 어렵고 4개 신규 SNP(AX-95222044, AX-94685526, AX-94550996, AX-94970315)가 7.7-8.9일 조기 출수를 설명합니다.

따라서 default 표시 패널:

- **qDH-3A** (LOD 59.4, PVE 72.6%, 3.5-4.9일 단축, Cha 2025 BMC Plant Biol — KASP 마커 검증 완료)
- **qPC-3A** (고단백, 입중 trade-off 최소, Cha 2026 TAG)
- **NAM-B1** (165 cv 중 41 cv 보유, Cho 2023 Agronomy 13:1977)
- **Fhb1** (PFT_KASP, Su 2019 PPJ — 'Chokwang' R haplotype)
- **Tamyb10**
- **TaMKK3-A**

### 5.2 KASP 마커 라이브러리 내장

**Rasheed 2016**(TAG 129:1843, 70 KASP for Vrn/Ppd/TaGW2/TaGS5/TaCwi/TaTGW6/Sus1/GASR7/Glu/Pin/Wx/Psy/Zds/Lr/Sr/Yr/Fhb/Tsn/abiotic) + **Rasheed 2019** + **Ravel 2020**(Glu-A1/B1) + **Wu 2023**(dKASP 호모이올로그 동시 검출 Rht/Pin/Glu) + **CerealsDB** 일괄 로드 모듈이 핵심.

한국 검증 마커:
- qDH-3A KASP
- NAM-B1 KASP (Cho 2023)
- PFT_KASP (Chokwang 검증)
- Park 2022 plastome ASP/TaqMan (Sooan/Baegjoong/Goso/Keumkang/Saekeumkang vs Jokyoung/Baekkang 그룹 구분)
- KWSM001-015 (NICS 32 한국 cv 식별)

### 5.3 종/배수성 토글 분기

**Hexaploid(AABBDD, 2n=42) / Tetraploid durum(AABB, 2n=28) / Synthetic(SHW) / Wild relative**(Ae. tauschii, T. dicoccoides, T. timopheevii) 토글에서:
- D 게놈 마커 활성/비활성
- durum 전용 좌위(Glu-A3/B3 LMW-GS, Lpx-B1, Psy-A1/B1, Gpc-B1) 강조
- 호모이올로그 triplet 처리(VRN-1=5A/5B/5D, Ppd-1=2A/2B/2D, Rht=4B/4D, Glu-1=1A/1B/1D, Pin=5DS만 단일)

가 자동 적용되어야 합니다. **Vrn-1은 dominant 한 게놈만으로도 봄성**이 결정되므로 GLM 외에 dominance 모델 옵션이 필수입니다.

### 5.4 한국 품종 DB

농진청 육성 40+ 품종 (KISTI JAKO201610364969857, NICS DB 기반):

| 품종 | 영문명 | 등록 | 특징 |
|---|---|---|---|
| 금강 | Keumkang | 1990s | 대표 hard white |
| 조경 | Jokyoung | 1995 | Seri 82×금강 |
| 백강 | Baekkang | 2005 | 가장 많이 재배 |
| 새금강 | Saekeumkang | — | 도복/내병성↑ |
| 황금알 | Hwanggeumal | — | hard red 제빵 |
| 중모2008 | Joongmo2008 | — | 단백질 한국 최고, NAM-B1 비기능형이지만 high PC |
| 이룸 | Ireum | 2024 | gluten 10/10 |
| 고소 | Goso | — | soft 과자용 |
| 신미찰1호 | Shinmichal1 | — | 찰밀 waxy |

각 품종의 등록번호·pedigree·KASP 패턴을 메타데이터로 임베드.

---

## 6. 농진청 표준 보고서 자동 생성

**품종보호 출원품종 심사요령**(국립종자원예규 제190호, 2024.7.1 시행) 및 농진청 직무육성품종 신고 절차에 맞춰 한국어 PDF가 11개 섹션으로 자동 생성:

1. 표지
2. 요약
3. 재료 및 방법
4. 표현형 통계
5. 연관지도
6. QTL 표
7. 그림
8. MTA 표
9. DUS 보조표
10. 참고문헌
11. 부록

Methods 섹션 영문 TAG/PBJ 양식 템플릿:

> "QTL analysis was performed using [TOOL] v1.0 (browser-based, Pyodide WebAssembly), implementing [ICIM-ADD/CIM/FarmCPU]. The scanning step was [1.0] cM and the LOD threshold was [X.X] by [1,000] permutation tests at α=0.05..."

자동 채워지며 Voorrips 2002, Meng 2015, Wang 2016(GAPIT3), Liu 2016(FarmCPU), Huang 2019(BLINK), Broman 2019(R/qtl2) 인용을 BibTeX로 자동 삽입. 매개변수 전체 로그와 데이터 SHA-256 해시를 부록에 포함하여 재현성 보장.

---

## 7. 단계별 구현 로드맵

### Phase 1 — MVP (4-6주, 즉시)

- [ ] 단일 HTML 골격 + Pyodide + Plotly + XLSX.js + i18n(ko/en) + DMRT 테마 + 파비콘(ssallogo.png) + QRCode.js 중복 방지
- [ ] 7-Step Wizard UI + Shepherd.js onboarding
- [ ] VCF + Illumina 90K/15K Final Report + HapMap 파서 + 자동 감지 Tier 1-3 + IWGSC v2.1 lookup 캐시(IndexedDB, ~5-15MB 압축)
- [ ] SMA(scipy.stats) + GLM/MLM GWAS + IM(자체 EM)
- [ ] Manhattan(scattergl, sub-genome A/B/D 색조) + LOD plot(1-LOD/2-LOD 음영) + 21 chr linkage map 다중 패널
- [ ] 예시 데이터(Wang 2014 또는 농진청 공개 RIL) 1-2종 + xlsx/PNG export
- [ ] **Ensembl Plants REST + T3/Wheat BrAPI v2** 직접 호출 통합
- [ ] 한국어/영어 보고서 자동 생성 v1

### Phase 2 — Production (3-6개월, 단기)

- [ ] Axiom 35K/820K + DArTseq SilicoDArT/SNP + KASP KlusterCaller XLSX 파서
- [ ] **webR 통합** — R/qtl2 HK regression/LMM, R/qtl CIM/MQM
- [ ] FarmCPU + BLINK 자체 구현
- [ ] ICIM-ADD Python 재구현 + IciMapping 공개 데이터셋 회귀 테스트
- [ ] 흑백/색맹 토글 + Okabe-Ito/ColorBrewer 팔레트 선택기 + SVG/PDF/CMYK 미리보기 + 학술지 column 폭(88/180mm) preset
- [ ] Genotype heatmap(A/B/H/-, recombination breakpoint) + boxplot/violin(ANOVA brackets) + 3D PCA + kinship dendrogram
- [ ] **KASP 모듈** — QTL→flanking SNP→IWGSC RefSeq v2.1 BLAST→primer 후보(PolyMarker 통합) + dKASP(Wu 2023) 호모이올로그 검증
- [ ] 한국 밀 품종 DB 30+ 내장(금강/조경/새금강/백강/황금알/이룸/중모2008…) + 품종 인증 모듈(Park 2022 plastome + KWSM)
- [ ] CerealsDB + GrainGenes + WheatQTLdb V2.0 사전 ETL 정적 호스팅 통합
- [ ] Service Worker 오프라인 캐싱
- [ ] Web Worker 분산 permutation test
- [ ] OPFS 영속화 + Apache Arrow IPC

### Phase 3 — Advanced (6-12개월, 중기)

- [ ] WheatOmics pangenome(WheatPanache 16-genome) + 1062 wheat genomes 변이 통합
- [ ] RDA Genebank OpenAPI 백엔드 프록시 + NICS K-Wheat DB 연계
- [ ] Meta-QTL 모듈(BioMercator Veyrieras 2-step Python 포팅)
- [ ] R/qtl2 MAGIC/multi-parent 인구 지원
- [ ] WheatQTLdb co-localization lookup + POTAGE/Ensembl candidate gene 자동 후보 압축
- [ ] T3 BrAPI bidirectional sync + STRUCTURE/ADMIXTURE stacked bar
- [ ] DUS test 보조 marker panel 추천(UPOV TG/3/12 27 형질 연동) + 국립종자원 서식 직접 출력
- [ ] ML/Bayesian 옵션 — scikit-learn LASSO/RF/GBM 즉시, BGLR webR 통합 시도, ONNX-Web으로 사전 학습 deep model 추론(WheatGP CNN+LSTM 등 Montesinos-López 2024)
- [ ] WebGPU compute(향후 Plotly WebGPU 백엔드 출시 시) + memory64 wasm 마이그레이션

---

## 결론 — 5가지 동시 충족 메시지

기존 도구 어느 하나도 "**설치 불필요 + 로컬 처리 + 한국어 + KASP 자동 + 농진청 보고서**"를 동시에 제공하지 않습니다. MapQTL/IciMapping의 분석력, GAPIT의 GWAS 다양성, MapChart의 출판 시각화, T3의 breeder 친화 UX, WheatQTLdb의 wheat 지식을 **단일 HTML**에 통합하면서, 농진청·국립식량과학원·민간 종묘회사의 일상 워크플로우(KASP 검증, 품종보호 출원, 직무육성품종 신고)에 직접 결합한다는 점이 본 도구의 unique value입니다.

기술적으로는 **webR + Pyodide + OPFS + Plotly scattergl**가 단일-HTML 환경의 최적 스택이며, **R/qtl2 wasm 빌드가 r-universe에 이미 존재**한다는 사실이 CIM/MQM 구현의 결정적 우위입니다.

14.5Gb 게놈은 청크 lazy loading으로 메모리 100MB 내 운용 가능하며:
- **35K Wheat Breeders' Array는 Affymetrix Axiom**이라는 점
- **90K의 D-genome coverage는 ≈4.6%**에 불과하다는 점
- **87.2% 정확도는 벼 모델이며 밀 재학습·재검증이 필수**라는 점

을 도구 UI에 명시적으로 알려야 사용자 신뢰가 유지됩니다.

---

*작성일: 2026-05-07*
*기준 자료: 본 저장소 `qtl_tool/` v1.2 (PR #320, commit ff4a9d5) 기준*
*상태: 리서치 완료 (draft) — Phase 1 MVP 구현 진입*
