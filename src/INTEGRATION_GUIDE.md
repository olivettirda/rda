# BDSS 모듈 통합 가이드

## 개요

이 문서는 BDSS (Breeding Decision Support System) 모듈을 기존 `rice_breeding_v4_16_prediction.html`에 통합하는 방법을 설명합니다.

## 폴더 구조

```
src/
├── js/
│   └── bdss/
│       ├── models.js              # 도메인 모델 (RicePlant, Genotype, Rf유전자)
│       ├── crossing-engine.js      # 교배 엔진 (CMS Dead-End, 분리왜곡)
│       ├── breeding-recommender.js # 육종 방법 추천 엔진
│       ├── marker-selector.js      # MAS 마커 선택기
│       └── index.js                # 모듈 진입점
├── py/
│   └── statistical_engine.py       # 통계 분석 엔진 (BLUP, WAASB, MTSI)
└── tests/
    ├── test_bdss_js.html           # JavaScript 테스트
    └── test_statistical_engine.py  # Python 테스트
```

## HTML에 모듈 추가

### Step 1: JavaScript 파일 로드

`rice_breeding_v4_16_prediction.html`의 `<head>` 또는 `<body>` 끝에 추가:

```html
<!-- BDSS Core Modules -->
<script src="src/js/bdss/models.js"></script>
<script src="src/js/bdss/crossing-engine.js"></script>
<script src="src/js/bdss/breeding-recommender.js"></script>
<script src="src/js/bdss/marker-selector.js"></script>
<script src="src/js/bdss/index.js"></script>
```

### Step 2: Pyodide에서 통계 엔진 로드

기존 Pyodide 초기화 코드에 추가:

```javascript
async function initPyodide() {
    pyodide = await loadPyodide();
    await pyodide.loadPackage(['numpy']);

    // BDSS 통계 엔진 로드
    const statEngineCode = await fetch('src/py/statistical_engine.py').then(r => r.text());
    await pyodide.runPythonAsync(statEngineCode);

    console.log('[BDSS] 통계 엔진 로드 완료');
}
```

## 사용 예제

### 1. CMS 3계통 교배 검증

```javascript
// BDSS 모듈 사용
const { RicePlant, RfGene, Genotype, CMSType, CytoplasmType, CrossingEngine } = window.BDSS;

// A계통 (불임계) 생성
const rfA = new RfGene('Rf1', 'r', 'r', [CMSType.WA], 1.0);
const genotypeA = new Genotype({}, [rfA]);
const aLine = new RicePlant({
    name: '신동진A',
    cytoplasm: CytoplasmType.STERILE,
    cmsType: CMSType.WA,
    genotype: genotypeA
});

// R계통 (회복계) 생성
const rfR = new RfGene('Rf1', 'R', 'R', [CMSType.WA], 1.0);
const genotypeR = new Genotype({}, [rfR]);
const rLine = new RicePlant({
    name: '일품R',
    cytoplasm: CytoplasmType.FERTILE,
    genotype: genotypeR
});

// 교배 엔진으로 검증
const engine = new CrossingEngine();
const validation = engine.validateCross(aLine, rLine);

if (validation.isValid) {
    const result = engine.performCross(aLine, rLine);
    console.log('F1 임성:', result.offspring.determineFertility());
} else {
    console.warn('교배 불가:', validation.reason);
}
```

### 2. 육종 방법 추천

```javascript
const { BreedingMethodRecommender, BreedingProgramConfig, TraitType } = window.BDSS;

const recommender = new BreedingMethodRecommender();

const config = new BreedingProgramConfig({
    programName: '다수성 내병성 육종',
    targetTraits: ['yield', 'blast_resistance'],
    budgetLimit: 200000000,  // 2억
    timeLimitYears: 6,
    hasSpeedBreeding: true,
    hasDHFacility: false
});

const result = recommender.recommend(
    config,
    { yield: 0.30, blast_resistance: 0.75 },
    { yield: TraitType.QUANTITATIVE, blast_resistance: TraitType.QUALITATIVE }
);

console.log('추천 방법:', result.recommended_method);
console.log('신뢰도:', (result.confidence_score * 100).toFixed(0) + '%');
console.log('추천 이유:', result.reasoning.join('\n'));
```

### 3. MAS 마커 선택

```javascript
const { MASMarkerSelector } = window.BDSS;

const selector = new MASMarkerSelector({ confidenceLevel: 0.95 });

// 목표 유전자
const targetGenes = [
    { name: 'Pi-ta', chromosome: '12', position: 10.5 },
    { name: 'Xa21', chromosome: '11', position: 21.0 }
];

// 가용 마커
const markers = [
    { name: 'RM144', chromosome: '12', position: 10.2 },
    { name: 'RM21', chromosome: '11', position: 20.5 }
];

const result = selector.selectMinimumMarkerSet(targetGenes, markers);
console.log('선택된 마커:', result.selectedMarkers.map(m => m.name));
console.log('커버리지:', (result.coverage * 100).toFixed(0) + '%');
console.log('필요 집단 크기:', result.recommendedPopulationSize);
```

### 4. WAASB/WAASBY 분석 (Pyodide)

```javascript
async function runStabilityAnalysis(yieldMatrix, genotypeNames) {
    // Python 통계 엔진 호출
    const waasb = await pyodide.runPythonAsync(`
        engine = create_engine(0.6, 0.4)
        results = calculate_waasb_from_js(
            engine,
            ${JSON.stringify(yieldMatrix)},
            ${JSON.stringify(genotypeNames)}
        )
        results
    `);

    // WAASBY 계산
    const waasby = await pyodide.runPythonAsync(`
        waasby_results = calculate_waasby_from_js(engine, results)
        waasby_results
    `);

    return waasby.toJs();
}
```

### 5. 엘리트 모본 선발

```javascript
async function identifyEliteParents(yieldMatrix, genotypeNames) {
    const elite = await pyodide.runPythonAsync(`
        engine = create_engine()
        identify_elite_from_js(
            engine,
            ${JSON.stringify(yieldMatrix)},
            ${JSON.stringify(genotypeNames)},
            None,  # trait_matrix
            "waasby",
            10  # top_n
        )
    `);

    return elite.toJs();
}
```

## 기존 코드 통합 패턴

### 교배 조합 탐색에 CMS 검증 추가

기존 `findCrossoverCombinations()` 함수에 추가:

```javascript
function findCrossoverCombinations() {
    // 기존 조합 생성 로직...
    const combinations = [];

    for (let i = 0; i < varieties.length; i++) {
        for (let j = i + 1; j < varieties.length; j++) {
            const mother = varieties[i];
            const father = varieties[j];

            // BDSS CMS 검증 추가
            if (window.BDSS && window.BDSS.CrossingEngine) {
                const engine = new window.BDSS.CrossingEngine();

                // 품종을 RicePlant로 변환 (필요시)
                const motherPlant = convertToRicePlant(mother);
                const fatherPlant = convertToRicePlant(father);

                const validation = engine.validateCross(motherPlant, fatherPlant);

                if (!validation.isValid) {
                    console.log(`[BDSS] ${mother.name} × ${father.name} 불가: ${validation.reason}`);
                    // Dead-End 조합 제외 또는 경고 표시
                    combinations.push({
                        mother: mother,
                        father: father,
                        valid: false,
                        deadEndType: validation.deadEndType,
                        reason: validation.reason
                    });
                    continue;
                }

                // 경고 수집
                if (validation.warnings.length > 0) {
                    console.log(`[BDSS] 경고: ${validation.warnings.join(', ')}`);
                }
            }

            // 기존 조합 추가 로직...
            combinations.push({
                mother: mother,
                father: father,
                valid: true,
                // ... 기존 속성
            });
        }
    }

    return combinations;
}

// 품종 데이터를 RicePlant로 변환하는 헬퍼 함수
function convertToRicePlant(variety) {
    const { RicePlant, Genotype, CytoplasmType } = window.BDSS;

    // 유전자형 변환
    const markerData = {};
    for (const [gene, value] of Object.entries(variety.genotype || {})) {
        markerData[gene] = value;
    }

    const genotype = new Genotype(markerData);

    // CMS 정보 추출 (있다면)
    const cytoplasm = variety.cms ? CytoplasmType.STERILE : CytoplasmType.FERTILE;

    return new RicePlant({
        id: variety.id,
        name: variety.name,
        genotype: genotype,
        cytoplasm: cytoplasm
    });
}
```

## 주의사항

1. **스크립트 로드 순서**: `models.js` → `crossing-engine.js` → 기타 모듈 → `index.js`
2. **Pyodide 초기화**: 통계 엔진 사용 전 반드시 Pyodide와 numpy 로드 필요
3. **디버깅**: 모든 BDSS 함수는 `console.log`로 상세 로그 출력
4. **네임스페이스**: 모든 BDSS 클래스/함수는 `window.BDSS` 객체에 등록됨

## 테스트

### JavaScript 테스트

```bash
# 브라우저에서 열기
open src/tests/test_bdss_js.html
```

### Python 테스트

```bash
# pytest 실행
cd /home/user/rda
python -m pytest src/tests/test_statistical_engine.py -v
```

## 디버깅

BDSS 모듈은 상세한 로그를 출력합니다:

```javascript
// 브라우저 콘솔에서 확인
[RicePlant] 생성: 신동진A (RICE_xxxxx), 세포질: S, CMS: WA
[CrossingEngine] 교배 시작: 신동진A × 일품R
[CrossingEngine] 교배 성공: 신동진A×일품R_F1
```

로그 비활성화가 필요하면:

```javascript
// console.log를 오버라이드하는 방식은 권장하지 않음
// 대신 각 모듈의 로그 레벨 설정 기능 추가 고려
```
