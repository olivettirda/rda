/**
 * BDSS Core Models - 벼 육종 시뮬레이터 핵심 도메인 모델
 *
 * CMS(세포질 웅성불임) 시스템, Rf 유전자, 모계 효과 유전자 모델링
 */

// ============================================================================
// Enumerations
// ============================================================================

/**
 * CMS(세포질 웅성불임) 유형
 */
const CMSType = Object.freeze({
    WA: 'WA',      // Wild Abortive - 가장 일반적
    BT: 'BT',      // Boro II type
    HL: 'HL',      // Honglian
    CW: 'CW',      // CW type
    NORMAL: 'N'   // 정상 세포질
});

/**
 * 세포질 유형 (모계 유전)
 */
const CytoplasmType = Object.freeze({
    STERILE: 'S',    // 불임 세포질 (CMS)
    FERTILE: 'F'     // 가임 세포질 (정상)
});

/**
 * 임성 상태
 */
const FertilityStatus = Object.freeze({
    FERTILE: 'fertile',           // 가임
    STERILE: 'sterile',           // 불임
    PARTIAL: 'partial_fertile'    // 부분 가임
});

/**
 * 육종 방법
 */
const BreedingMethod = Object.freeze({
    PEDIGREE: 'pedigree',
    SSD: 'ssd',          // Single Seed Descent
    BULK: 'bulk',
    DH: 'dh',            // Doubled Haploid
    MABC: 'mabc',        // Marker-Assisted Backcross
    MARS: 'mars'         // Marker-Assisted Recurrent Selection
});

/**
 * 형질 유형
 */
const TraitType = Object.freeze({
    QUALITATIVE: 'qualitative',      // 질적 형질 (주동 유전자)
    QUANTITATIVE: 'quantitative',    // 양적 형질 (다인자)
    OLIGOGENIC: 'oligogenic'         // 과소 유전자 형질
});

/**
 * 3계통 역할 (CMS 시스템)
 */
const LineRole = Object.freeze({
    A_LINE: 'A',  // CMS 불임계 (종자 생산)
    B_LINE: 'B',  // 유지계 (A계통 유지)
    R_LINE: 'R'   // 회복계 (임성 회복)
});


// ============================================================================
// Rf Gene Model (회복 유전자)
// ============================================================================

/**
 * Rf(Restorer of Fertility) 유전자 클래스
 *
 * 용량 효과(Dosage Effect) 모델:
 * - RR (동형접합 우성): 완전 회복 (100%)
 * - Rr (이형접합): 부분 회복 (환경 의존적, 60-80%)
 * - rr (동형접합 열성): 미회복 (불임 유지)
 */
class RfGene {
    /**
     * @param {string} name - 유전자명 (예: Rf1, Rf3, Rf4)
     * @param {string} allele1 - 대립유전자 1 ('R' 또는 'r')
     * @param {string} allele2 - 대립유전자 2 ('R' 또는 'r')
     * @param {CMSType[]} targetCMS - 회복 가능한 CMS 유형 목록
     * @param {number} restorationPower - 회복력 (0-1)
     */
    constructor(name, allele1, allele2, targetCMS = [], restorationPower = 1.0) {
        this.name = name;
        this.allele1 = allele1.toUpperCase() === 'R' ? 'R' : 'r';
        this.allele2 = allele2.toUpperCase() === 'R' ? 'R' : 'r';
        this.targetCMS = targetCMS;
        this.restorationPower = Math.max(0, Math.min(1, restorationPower));

        console.log(`[RfGene] 생성: ${name} ${this.allele1}${this.allele2}, 회복력: ${this.restorationPower}`);
    }

    /**
     * 유전자형 문자열 반환
     */
    get genotype() {
        return `${this.allele1}${this.allele2}`;
    }

    /**
     * 동형접합 우성 여부 (RR)
     */
    get isHomozygousDominant() {
        return this.allele1 === 'R' && this.allele2 === 'R';
    }

    /**
     * 이형접합 여부 (Rr)
     */
    get isHeterozygous() {
        return (this.allele1 === 'R' && this.allele2 === 'r') ||
               (this.allele1 === 'r' && this.allele2 === 'R');
    }

    /**
     * 동형접합 열성 여부 (rr)
     */
    get isHomozygousRecessive() {
        return this.allele1 === 'r' && this.allele2 === 'r';
    }

    /**
     * 회복 효과 계산 (Dosage Effect)
     * @param {number} temperature - 평균 온도 (°C)
     * @returns {number} 회복율 (0-1)
     */
    calculateRestorationEffect(temperature = 25) {
        let baseEffect = 0;

        if (this.isHomozygousDominant) {
            // RR: 완전 회복
            baseEffect = 1.0;
        } else if (this.isHeterozygous) {
            // Rr: 부분 회복 (온도 의존적)
            // 고온에서 회복력 감소 (온도 스트레스)
            if (temperature > 35) {
                baseEffect = 0.4;  // 고온 스트레스
            } else if (temperature < 20) {
                baseEffect = 0.6;  // 저온 스트레스
            } else {
                baseEffect = 0.75; // 정상 조건
            }
        } else {
            // rr: 미회복
            baseEffect = 0;
        }

        const finalEffect = baseEffect * this.restorationPower;
        console.log(`[RfGene] ${this.name} 회복 효과: ${(finalEffect * 100).toFixed(1)}% (온도: ${temperature}°C)`);
        return finalEffect;
    }

    /**
     * 특정 CMS 유형에 대한 회복 가능 여부
     */
    canRestore(cmsType) {
        return this.targetCMS.includes(cmsType) && !this.isHomozygousRecessive;
    }

    /**
     * 배우자 생성 (감수분열)
     * @returns {string} 'R' 또는 'r'
     */
    produceGamete() {
        if (this.isHomozygousDominant) return 'R';
        if (this.isHomozygousRecessive) return 'r';
        // 이형접합: 50:50 분리
        return Math.random() < 0.5 ? 'R' : 'r';
    }
}


// ============================================================================
// Maternal Effect Gene Model (모계 효과 유전자)
// ============================================================================

/**
 * 모계 효과 유전자 클래스
 *
 * 종자 형질이 모계의 유전자형에 의해 결정됨
 * - OsPHO1;2: 종자 인산 축적 (저장 인 함량)
 * - Rc: 종피색 (적미/백미)
 * - wx: 아밀로스 함량 (찹쌀/멥쌀)
 */
class MaternalEffectGene {
    /**
     * @param {string} name - 유전자명
     * @param {string} allele1 - 대립유전자 1
     * @param {string} allele2 - 대립유전자 2
     * @param {string} trait - 관련 형질
     * @param {number} effectStrength - 모계 효과 강도 (0-1)
     */
    constructor(name, allele1, allele2, trait, effectStrength = 1.0) {
        this.name = name;
        this.allele1 = allele1;
        this.allele2 = allele2;
        this.trait = trait;
        this.effectStrength = Math.max(0, Math.min(1, effectStrength));

        console.log(`[MaternalEffectGene] 생성: ${name} (${allele1}${allele2}), 형질: ${trait}`);
    }

    get genotype() {
        return `${this.allele1}${this.allele2}`;
    }

    /**
     * 모계 효과 표현형 계산
     * @returns {Object} 형질 값 및 설명
     */
    calculateMaternalPhenotype() {
        const isDominantPresent = this.allele1.toUpperCase() === this.allele1 ||
                                   this.allele2.toUpperCase() === this.allele2;

        let phenotype = {};

        switch (this.name) {
            case 'OsPHO1;2':
                // 우성: 정상 인 축적, 열성: 저인
                phenotype = {
                    value: isDominantPresent ? 'normal_P' : 'low_P',
                    description: isDominantPresent ? '정상 인 축적' : '저인 종자',
                    effectStrength: this.effectStrength
                };
                break;

            case 'Rc':
                // Rc (우성): 적미, rc (열성): 백미
                phenotype = {
                    value: isDominantPresent ? 'red' : 'white',
                    description: isDominantPresent ? '적색 종피 (적미)' : '백색 종피 (백미)',
                    effectStrength: this.effectStrength
                };
                break;

            case 'wx':
                // Wx (우성): 멥쌀, wx (열성): 찹쌀
                phenotype = {
                    value: isDominantPresent ? 'non_waxy' : 'waxy',
                    description: isDominantPresent ? '멥쌀 (아밀로스 정상)' : '찹쌀 (아밀로스 결핍)',
                    effectStrength: this.effectStrength
                };
                break;

            default:
                phenotype = {
                    value: isDominantPresent ? 'dominant' : 'recessive',
                    description: `${this.name} 모계 효과`,
                    effectStrength: this.effectStrength
                };
        }

        console.log(`[MaternalEffectGene] ${this.name} 표현형: ${phenotype.description}`);
        return phenotype;
    }
}


// ============================================================================
// Genotype Model (유전자형)
// ============================================================================

/**
 * 유전자형 클래스
 *
 * 마커별 유전자형 정보 관리
 * A = 친 1 동형접합, B = 친 2 동형접합, H = 이형접합
 */
class Genotype {
    /**
     * @param {Object} markerData - {마커명: 유전자형(A/B/H/-)}
     * @param {RfGene[]} rfGenes - Rf 유전자 목록
     * @param {MaternalEffectGene[]} maternalGenes - 모계 효과 유전자 목록
     */
    constructor(markerData = {}, rfGenes = [], maternalGenes = []) {
        this.markers = { ...markerData };
        this.rfGenes = rfGenes;
        this.maternalGenes = maternalGenes;

        console.log(`[Genotype] 생성: ${Object.keys(this.markers).length}개 마커`);
    }

    /**
     * 특정 마커의 유전자형 반환
     */
    getMarker(markerName) {
        return this.markers[markerName] || '-';
    }

    /**
     * 마커 유전자형 설정
     */
    setMarker(markerName, value) {
        this.markers[markerName] = value;
    }

    /**
     * A (친 1 동형접합) 마커 비율
     */
    get aFrequency() {
        const values = Object.values(this.markers).filter(v => v !== '-');
        if (values.length === 0) return 0;
        return values.filter(v => v === 'A').length / values.length;
    }

    /**
     * B (친 2 동형접합) 마커 비율
     */
    get bFrequency() {
        const values = Object.values(this.markers).filter(v => v !== '-');
        if (values.length === 0) return 0;
        return values.filter(v => v === 'B').length / values.length;
    }

    /**
     * H (이형접합) 마커 비율
     */
    get heterozygosity() {
        const values = Object.values(this.markers).filter(v => v !== '-');
        if (values.length === 0) return 0;
        return values.filter(v => v === 'H').length / values.length;
    }

    /**
     * 결측치 비율
     */
    get missingRate() {
        const values = Object.values(this.markers);
        if (values.length === 0) return 1;
        return values.filter(v => v === '-' || v === '' || v === null).length / values.length;
    }

    /**
     * Rf 유전자 전체 회복력 계산
     */
    calculateTotalRestorationPower(cmsType, temperature = 25) {
        let totalPower = 0;

        for (const rf of this.rfGenes) {
            if (rf.canRestore(cmsType)) {
                totalPower += rf.calculateRestorationEffect(temperature);
            }
        }

        // 최대 1.0으로 제한
        return Math.min(1, totalPower);
    }

    /**
     * 유전자형 복제
     */
    clone() {
        return new Genotype(
            { ...this.markers },
            this.rfGenes.map(rf => new RfGene(rf.name, rf.allele1, rf.allele2, rf.targetCMS, rf.restorationPower)),
            this.maternalGenes.map(mg => new MaternalEffectGene(mg.name, mg.allele1, mg.allele2, mg.trait, mg.effectStrength))
        );
    }
}


// ============================================================================
// Phenotype Model (표현형)
// ============================================================================

/**
 * 표현형 클래스
 */
class Phenotype {
    /**
     * @param {Object} traitValues - {형질명: 값}
     */
    constructor(traitValues = {}) {
        this.traits = { ...traitValues };
    }

    /**
     * 형질 값 가져오기
     */
    getTrait(traitName) {
        return this.traits[traitName];
    }

    /**
     * 형질 값 설정
     */
    setTrait(traitName, value) {
        this.traits[traitName] = value;
    }

    /**
     * 모든 형질 목록
     */
    get traitNames() {
        return Object.keys(this.traits);
    }

    /**
     * 복제
     */
    clone() {
        return new Phenotype({ ...this.traits });
    }
}


// ============================================================================
// Rice Plant Model (벼 품종)
// ============================================================================

/**
 * 벼 품종 클래스
 *
 * CMS 시스템, 유전자형, 표현형 통합 관리
 */
class RicePlant {
    /**
     * @param {Object} config - 초기화 설정
     * @param {string} config.id - 품종 ID
     * @param {string} config.name - 품종명
     * @param {Genotype} config.genotype - 유전자형
     * @param {Phenotype} config.phenotype - 표현형
     * @param {CytoplasmType} config.cytoplasm - 세포질 유형
     * @param {CMSType} config.cmsType - CMS 유형
     * @param {LineRole} config.lineRole - 3계통 역할
     * @param {string} config.origin - 원산지/유래
     */
    constructor(config = {}) {
        this.id = config.id || `RICE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = config.name || 'Unknown';
        this.genotype = config.genotype || new Genotype();
        this.phenotype = config.phenotype || new Phenotype();
        this.cytoplasm = config.cytoplasm || CytoplasmType.FERTILE;
        this.cmsType = config.cmsType || CMSType.NORMAL;
        this.lineRole = config.lineRole || null;
        this.origin = config.origin || '';
        this.pedigree = config.pedigree || [];  // 계보 정보
        this.generation = config.generation || 'P';  // 세대 (P, F1, F2, ...)

        console.log(`[RicePlant] 생성: ${this.name} (${this.id}), 세포질: ${this.cytoplasm}, CMS: ${this.cmsType}`);
    }

    /**
     * 불임 세포질 여부
     */
    get hasSterileCytoplasm() {
        return this.cytoplasm === CytoplasmType.STERILE;
    }

    /**
     * CMS 계통 여부
     */
    get isCMSLine() {
        return this.hasSterileCytoplasm && this.cmsType !== CMSType.NORMAL;
    }

    /**
     * 임성 상태 판정
     * @param {number} temperature - 환경 온도
     * @returns {FertilityStatus}
     */
    determineFertility(temperature = 25) {
        // 정상 세포질은 항상 가임
        if (!this.hasSterileCytoplasm) {
            console.log(`[RicePlant] ${this.name}: 정상 세포질 - 가임`);
            return FertilityStatus.FERTILE;
        }

        // CMS 세포질인 경우 Rf 유전자 확인
        const restorationPower = this.genotype.calculateTotalRestorationPower(this.cmsType, temperature);

        if (restorationPower >= 0.9) {
            console.log(`[RicePlant] ${this.name}: 완전 회복 (${(restorationPower * 100).toFixed(1)}%) - 가임`);
            return FertilityStatus.FERTILE;
        } else if (restorationPower >= 0.5) {
            console.log(`[RicePlant] ${this.name}: 부분 회복 (${(restorationPower * 100).toFixed(1)}%) - 부분 가임`);
            return FertilityStatus.PARTIAL;
        } else {
            console.log(`[RicePlant] ${this.name}: 미회복 (${(restorationPower * 100).toFixed(1)}%) - 불임`);
            return FertilityStatus.STERILE;
        }
    }

    /**
     * 화분친으로 사용 가능 여부
     */
    canBePollenParent(temperature = 25) {
        return this.determineFertility(temperature) !== FertilityStatus.STERILE;
    }

    /**
     * 종자친으로 사용 가능 여부
     */
    canBeSeedParent() {
        // 모든 품종은 종자친 가능 (모계 유전을 위해)
        return true;
    }

    /**
     * 3계통 역할 자동 판정
     */
    determineLineRole() {
        if (!this.hasSterileCytoplasm) {
            // 정상 세포질
            const hasRfAllele = this.genotype.rfGenes.some(rf => !rf.isHomozygousRecessive);
            if (hasRfAllele) {
                this.lineRole = LineRole.R_LINE;  // 회복계
            } else {
                this.lineRole = LineRole.B_LINE;  // 유지계
            }
        } else {
            // 불임 세포질
            const restorationPower = this.genotype.calculateTotalRestorationPower(this.cmsType);
            if (restorationPower < 0.5) {
                this.lineRole = LineRole.A_LINE;  // 불임계
            } else {
                this.lineRole = LineRole.R_LINE;  // 회복계 (F1)
            }
        }

        console.log(`[RicePlant] ${this.name} 역할 판정: ${this.lineRole}-line`);
        return this.lineRole;
    }

    /**
     * 모계 효과 적용 종자 형질 계산
     */
    calculateSeedTraits() {
        const seedTraits = {};

        for (const gene of this.genotype.maternalGenes) {
            const maternalPhenotype = gene.calculateMaternalPhenotype();
            seedTraits[gene.trait] = maternalPhenotype;
        }

        return seedTraits;
    }

    /**
     * 품종 복제 (딥 카피)
     */
    clone() {
        return new RicePlant({
            id: `${this.id}_clone`,
            name: `${this.name}_clone`,
            genotype: this.genotype.clone(),
            phenotype: this.phenotype.clone(),
            cytoplasm: this.cytoplasm,
            cmsType: this.cmsType,
            lineRole: this.lineRole,
            origin: this.origin,
            pedigree: [...this.pedigree],
            generation: this.generation
        });
    }

    /**
     * 품종 정보 요약
     */
    getSummary() {
        return {
            id: this.id,
            name: this.name,
            cytoplasm: this.cytoplasm,
            cmsType: this.cmsType,
            lineRole: this.lineRole,
            fertility: this.determineFertility(),
            heterozygosity: (this.genotype.heterozygosity * 100).toFixed(1) + '%',
            markerCount: Object.keys(this.genotype.markers).length,
            generation: this.generation
        };
    }
}


// ============================================================================
// Breeding Program Configuration
// ============================================================================

/**
 * 육종 프로그램 설정
 */
class BreedingProgramConfig {
    /**
     * @param {Object} config - 설정 객체
     */
    constructor(config = {}) {
        this.programId = config.programId || `PROG_${Date.now()}`;
        this.programName = config.programName || '육종 프로그램';
        this.targetTraits = config.targetTraits || [];
        this.budgetLimit = config.budgetLimit || 100000000;  // 1억 원
        this.timeLimitYears = config.timeLimitYears || 10;
        this.hasSpeedBreeding = config.hasSpeedBreeding || false;
        this.hasDHFacility = config.hasDHFacility || false;
        this.fieldCapacity = config.fieldCapacity || 5000;  // 포장 수용력

        console.log(`[BreedingProgramConfig] 생성: ${this.programName}, 예산: ${this.budgetLimit.toLocaleString()}원`);
    }

    /**
     * 예산 내 적용 가능한 방법 확인
     */
    canAfford(estimatedCost) {
        return estimatedCost <= this.budgetLimit;
    }

    /**
     * 시간 내 완료 가능 여부
     */
    canCompleteInTime(estimatedYears) {
        return estimatedYears <= this.timeLimitYears;
    }
}


// ============================================================================
// Export for Browser/Node.js compatibility
// ============================================================================

// ES Module export (for modern browsers)
if (typeof window !== 'undefined') {
    window.BDSS = window.BDSS || {};
    window.BDSS.CMSType = CMSType;
    window.BDSS.CytoplasmType = CytoplasmType;
    window.BDSS.FertilityStatus = FertilityStatus;
    window.BDSS.BreedingMethod = BreedingMethod;
    window.BDSS.TraitType = TraitType;
    window.BDSS.LineRole = LineRole;
    window.BDSS.RfGene = RfGene;
    window.BDSS.MaternalEffectGene = MaternalEffectGene;
    window.BDSS.Genotype = Genotype;
    window.BDSS.Phenotype = Phenotype;
    window.BDSS.RicePlant = RicePlant;
    window.BDSS.BreedingProgramConfig = BreedingProgramConfig;
}

// CommonJS export (for Node.js)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CMSType,
        CytoplasmType,
        FertilityStatus,
        BreedingMethod,
        TraitType,
        LineRole,
        RfGene,
        MaternalEffectGene,
        Genotype,
        Phenotype,
        RicePlant,
        BreedingProgramConfig
    };
}
