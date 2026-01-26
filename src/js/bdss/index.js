/**
 * BDSS Core - 벼 육종 의사결정 지원 시스템
 *
 * 모듈 진입점 (Entry Point)
 */

// ============================================================================
// Module Imports (Browser)
// ============================================================================

// 브라우저 환경에서는 각 파일을 script 태그로 로드한 후
// window.BDSS 객체에서 접근합니다.

/**
 * BDSS 초기화 및 버전 정보
 */
const BDSS_VERSION = '1.0.0';
const BDSS_BUILD_DATE = '2026-01-26';

/**
 * BDSS 시스템 초기화
 */
function initBDSS() {
    console.log('='.repeat(50));
    console.log('BDSS Core 초기화');
    console.log(`버전: ${BDSS_VERSION}`);
    console.log(`빌드: ${BDSS_BUILD_DATE}`);
    console.log('='.repeat(50));

    // 필수 모듈 확인
    const requiredModules = [
        'CMSType',
        'CytoplasmType',
        'RicePlant',
        'CrossingEngine',
        'BreedingMethodRecommender',
        'MASMarkerSelector'
    ];

    const missingModules = [];
    const bdss = window.BDSS || {};

    for (const module of requiredModules) {
        if (!bdss[module]) {
            missingModules.push(module);
        }
    }

    if (missingModules.length > 0) {
        console.warn('[BDSS] 누락된 모듈:', missingModules.join(', '));
        console.warn('[BDSS] 다음 파일들을 로드했는지 확인하세요:');
        console.warn('  - src/js/bdss/models.js');
        console.warn('  - src/js/bdss/crossing-engine.js');
        console.warn('  - src/js/bdss/breeding-recommender.js');
        console.warn('  - src/js/bdss/marker-selector.js');
    } else {
        console.log('[BDSS] 모든 모듈 로드 완료');
    }

    // 버전 정보 추가
    bdss.VERSION = BDSS_VERSION;
    bdss.BUILD_DATE = BDSS_BUILD_DATE;

    return bdss;
}

/**
 * 빠른 테스트 (Quick Test)
 */
function runBDSSQuickTest() {
    console.log('\n[BDSS Quick Test] 시작...\n');

    const bdss = window.BDSS;
    let passed = 0;
    let failed = 0;

    // Test 1: RicePlant 생성
    try {
        const plant = new bdss.RicePlant({
            name: 'TestVariety',
            cytoplasm: bdss.CytoplasmType.FERTILE
        });
        console.log('✓ Test 1: RicePlant 생성 성공');
        passed++;
    } catch (e) {
        console.error('✗ Test 1: RicePlant 생성 실패', e);
        failed++;
    }

    // Test 2: CrossingEngine 초기화
    try {
        const engine = new bdss.CrossingEngine();
        console.log('✓ Test 2: CrossingEngine 초기화 성공');
        passed++;
    } catch (e) {
        console.error('✗ Test 2: CrossingEngine 초기화 실패', e);
        failed++;
    }

    // Test 3: BreedingMethodRecommender 초기화
    try {
        const recommender = new bdss.BreedingMethodRecommender();
        console.log('✓ Test 3: BreedingMethodRecommender 초기화 성공');
        passed++;
    } catch (e) {
        console.error('✗ Test 3: BreedingMethodRecommender 초기화 실패', e);
        failed++;
    }

    // Test 4: MASMarkerSelector 초기화
    try {
        const selector = new bdss.MASMarkerSelector();
        console.log('✓ Test 4: MASMarkerSelector 초기화 성공');
        passed++;
    } catch (e) {
        console.error('✗ Test 4: MASMarkerSelector 초기화 실패', e);
        failed++;
    }

    // Test 5: CMS Dead-End 검증
    try {
        const cmsPlant = new bdss.RicePlant({
            name: 'CMS_A',
            cytoplasm: bdss.CytoplasmType.STERILE,
            cmsType: bdss.CMSType.WA
        });

        const normalPlant = new bdss.RicePlant({
            name: 'Normal_B',
            cytoplasm: bdss.CytoplasmType.FERTILE
        });

        const engine = new bdss.CrossingEngine();
        const validation = engine.validateCross(cmsPlant, normalPlant);

        console.log(`✓ Test 5: CMS 교배 검증 성공 (유효: ${validation.isValid})`);
        passed++;
    } catch (e) {
        console.error('✗ Test 5: CMS 교배 검증 실패', e);
        failed++;
    }

    // 결과 출력
    console.log('\n' + '='.repeat(50));
    console.log(`[BDSS Quick Test] 완료: ${passed} 성공, ${failed} 실패`);
    console.log('='.repeat(50) + '\n');

    return { passed, failed };
}

/**
 * 데모: CMS 3계통 교배 시뮬레이션
 */
function demoCMS3LineSystem() {
    console.log('\n[BDSS Demo] CMS 3계통 시스템 시뮬레이션\n');

    const bdss = window.BDSS;

    // 1. A계통 (불임계) 생성
    const rfGeneA = new bdss.RfGene('Rf1', 'r', 'r', [bdss.CMSType.WA], 1.0);
    const genotypeA = new bdss.Genotype({}, [rfGeneA]);

    const aLine = new bdss.RicePlant({
        name: '신동진A',
        cytoplasm: bdss.CytoplasmType.STERILE,
        cmsType: bdss.CMSType.WA,
        genotype: genotypeA,
        lineRole: bdss.LineRole.A_LINE
    });

    console.log(`A계통: ${aLine.name}, 임성: ${aLine.determineFertility()}`);

    // 2. B계통 (유지계) 생성
    const rfGeneB = new bdss.RfGene('Rf1', 'r', 'r', [bdss.CMSType.WA], 1.0);
    const genotypeB = new bdss.Genotype({}, [rfGeneB]);

    const bLine = new bdss.RicePlant({
        name: '신동진B',
        cytoplasm: bdss.CytoplasmType.FERTILE,
        cmsType: bdss.CMSType.NORMAL,
        genotype: genotypeB,
        lineRole: bdss.LineRole.B_LINE
    });

    console.log(`B계통: ${bLine.name}, 임성: ${bLine.determineFertility()}`);

    // 3. R계통 (회복계) 생성
    const rfGeneR = new bdss.RfGene('Rf1', 'R', 'R', [bdss.CMSType.WA], 1.0);
    const genotypeR = new bdss.Genotype({}, [rfGeneR]);

    const rLine = new bdss.RicePlant({
        name: '일품R',
        cytoplasm: bdss.CytoplasmType.FERTILE,
        cmsType: bdss.CMSType.NORMAL,
        genotype: genotypeR,
        lineRole: bdss.LineRole.R_LINE
    });

    console.log(`R계통: ${rLine.name}, 임성: ${rLine.determineFertility()}`);

    // 4. 교배 수행
    const engine = new bdss.CrossingEngine();

    // A × B (유지 교배)
    console.log('\n--- A × B 교배 (유지 교배) ---');
    const abCross = engine.performCross(aLine, bLine);
    if (abCross.success) {
        console.log(`후대: ${abCross.offspring.name}`);
        console.log(`세포질: ${abCross.offspring.cytoplasm} (모계 유전)`);
        console.log(`임성: ${abCross.offspring.determineFertility()}`);
    } else {
        console.log(`교배 실패: ${abCross.reason}`);
    }

    // A × R (채종 교배)
    console.log('\n--- A × R 교배 (F1 채종) ---');
    const arCross = engine.performCross(aLine, rLine);
    if (arCross.success) {
        console.log(`F1: ${arCross.offspring.name}`);
        console.log(`세포질: ${arCross.offspring.cytoplasm}`);
        console.log(`임성: ${arCross.offspring.determineFertility()}`);
    } else {
        console.log(`교배 실패: ${arCross.reason}`);
    }

    console.log('\n[BDSS Demo] 완료\n');

    return { aLine, bLine, rLine, abCross, arCross };
}

// ============================================================================
// Global Export
// ============================================================================

if (typeof window !== 'undefined') {
    window.BDSS = window.BDSS || {};
    window.BDSS.init = initBDSS;
    window.BDSS.quickTest = runBDSSQuickTest;
    window.BDSS.demoCMS3Line = demoCMS3LineSystem;
    window.BDSS.VERSION = BDSS_VERSION;
    window.BDSS.BUILD_DATE = BDSS_BUILD_DATE;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BDSS_VERSION,
        BDSS_BUILD_DATE,
        initBDSS,
        runBDSSQuickTest,
        demoCMS3LineSystem
    };
}

console.log(`[BDSS] index.js 로드 완료 (v${BDSS_VERSION})`);
