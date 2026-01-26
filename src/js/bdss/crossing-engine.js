/**
 * BDSS Crossing Engine - 교배 엔진
 *
 * CMS 막다른 길(Dead-End) 감지, 분리왜곡, 모계 효과 처리
 */

// ============================================================================
// Crossing Engine Class
// ============================================================================

/**
 * 교배 엔진 클래스
 *
 * 주요 기능:
 * 1. CMS 막다른 길 감지 (A × A, A × R-rr)
 * 2. F2 분리왜곡 모델링
 * 3. 모계 효과 종자 형질 계산
 * 4. 재조합 이벤트 시뮬레이션
 */
class CrossingEngine {
    /**
     * @param {Object} config - 설정
     * @param {number} config.segregationDistortionCoeff - 분리왜곡 계수 (기본: 0.1)
     * @param {number} config.recombinationRate - 재조합율 (기본: 0.5)
     */
    constructor(config = {}) {
        this.segregationDistortionCoeff = config.segregationDistortionCoeff || 0.1;
        this.recombinationRate = config.recombinationRate || 0.5;
        this.crossHistory = [];

        console.log('[CrossingEngine] 초기화 완료, 분리왜곡 계수:', this.segregationDistortionCoeff);
    }

    /**
     * 교배 수행
     * @param {RicePlant} mother - 모본 (종자친)
     * @param {RicePlant} father - 부본 (화분친)
     * @param {Object} options - 교배 옵션
     * @returns {Object} 교배 결과
     */
    performCross(mother, father, options = {}) {
        console.log(`[CrossingEngine] 교배 시작: ${mother.name} × ${father.name}`);

        // 1. 교배 유효성 검증
        const validation = this.validateCross(mother, father, options.temperature || 25);
        if (!validation.isValid) {
            console.warn(`[CrossingEngine] 교배 불가: ${validation.reason}`);
            return {
                success: false,
                reason: validation.reason,
                warnings: validation.warnings,
                deadEndType: validation.deadEndType
            };
        }

        // 2. F1 자손 생성
        const f1Offspring = this._generateF1Offspring(mother, father, options);

        // 3. 모계 효과 종자 형질 계산
        const seedTraits = mother.calculateSeedTraits();

        // 4. 교배 이력 기록
        const crossRecord = {
            crossId: `CROSS_${Date.now()}`,
            mother: mother.getSummary(),
            father: father.getSummary(),
            offspring: f1Offspring.getSummary(),
            seedTraits: seedTraits,
            timestamp: new Date().toISOString(),
            warnings: validation.warnings
        };
        this.crossHistory.push(crossRecord);

        console.log(`[CrossingEngine] 교배 성공: ${f1Offspring.name}`);

        return {
            success: true,
            offspring: f1Offspring,
            seedTraits: seedTraits,
            crossId: crossRecord.crossId,
            warnings: validation.warnings
        };
    }

    /**
     * 교배 유효성 검증 (Dead-End 감지)
     * @param {RicePlant} mother - 모본
     * @param {RicePlant} father - 부본
     * @param {number} temperature - 환경 온도
     * @returns {Object} 검증 결과
     */
    validateCross(mother, father, temperature = 25) {
        const warnings = [];
        let deadEndType = null;

        // 1. 화분친 임성 검증 (불임이면 화분 불가)
        if (!father.canBePollenParent(temperature)) {
            return {
                isValid: false,
                reason: `화분친(${father.name})이 불임 상태입니다. CMS 계통은 화분친으로 사용할 수 없습니다.`,
                deadEndType: 'POLLEN_STERILITY',
                warnings: warnings
            };
        }

        // 2. CMS Dead-End 검증
        const cmsDeadEnd = this._checkCMSDeadEnd(mother, father, temperature);
        if (cmsDeadEnd.isDeadEnd) {
            return {
                isValid: false,
                reason: cmsDeadEnd.reason,
                deadEndType: cmsDeadEnd.type,
                warnings: warnings
            };
        }

        // 3. 경고 수집
        if (mother.isCMSLine && father.lineRole !== 'R') {
            warnings.push('CMS 계통과 비회복계 교배: 후대가 불임일 수 있습니다.');
        }

        // 4. Rf 이형접합 화분친 경고
        const fatherRfHeterozygous = father.genotype.rfGenes.some(rf => rf.isHeterozygous);
        if (fatherRfHeterozygous && mother.hasSterileCytoplasm) {
            warnings.push('회복계(Rf/rf)가 이형접합입니다. F2에서 분리왜곡이 예상됩니다.');
        }

        // 5. 고온 스트레스 경고
        if (temperature > 35 && fatherRfHeterozygous) {
            warnings.push(`고온(${temperature}°C) 조건: Rf/rf 이형접합체의 회복력이 감소할 수 있습니다.`);
        }

        return {
            isValid: true,
            reason: null,
            deadEndType: null,
            warnings: warnings
        };
    }

    /**
     * CMS 막다른 길 검사
     * @private
     */
    _checkCMSDeadEnd(mother, father, temperature) {
        // Dead-End 유형 1: A계통 × A계통
        if (mother.hasSterileCytoplasm && father.hasSterileCytoplasm) {
            // 화분친도 불임이면 실제로 교배 불가 (위에서 걸러짐)
            // 그러나 둘 다 CMS 계통이면 후대도 CMS가 됨
            const fatherFertility = father.determineFertility(temperature);
            if (fatherFertility === window.BDSS?.FertilityStatus?.STERILE) {
                return {
                    isDeadEnd: true,
                    type: 'A_LINE_CROSS',
                    reason: 'A계통(불임계) × A계통: 양쪽 모두 불임 세포질을 가지며, 후대가 불임이 됩니다.'
                };
            }
        }

        // Dead-End 유형 2: A계통 × B계통 (rf/rf)
        // 이것은 Dead-End가 아님 - 정상적인 A계통 유지 교배
        // 하지만 상업적 종자 생산에는 사용 불가

        // Dead-End 유형 3: 후대가 모두 불임이 되는 경우
        if (mother.hasSterileCytoplasm) {
            // 모본이 CMS인 경우 부본의 Rf 유전자 확인
            const fatherRfGenes = father.genotype.rfGenes;
            const relevantRf = fatherRfGenes.filter(rf => rf.canRestore(mother.cmsType));

            if (relevantRf.length === 0) {
                // 관련 Rf 유전자가 없으면 후대 모두 불임
                return {
                    isDeadEnd: true,
                    type: 'NO_RESTORER',
                    reason: `모본(${mother.name})의 ${mother.cmsType} CMS에 대한 회복 유전자가 부본(${father.name})에 없습니다. 후대가 모두 불임이 됩니다.`
                };
            }

            // 모든 Rf가 열성 동형접합(rf/rf)이면 Dead-End
            const allRfRecessive = relevantRf.every(rf => rf.isHomozygousRecessive);
            if (allRfRecessive) {
                return {
                    isDeadEnd: true,
                    type: 'RF_RECESSIVE',
                    reason: `부본(${father.name})의 모든 회복 유전자가 열성 동형접합(rf/rf)입니다. 후대가 모두 불임이 됩니다.`
                };
            }
        }

        return { isDeadEnd: false };
    }

    /**
     * F1 자손 생성
     * @private
     */
    _generateF1Offspring(mother, father, options = {}) {
        const offspringId = options.offspringId || `F1_${Date.now()}`;
        const offspringName = options.offspringName || `${mother.name}×${father.name}_F1`;

        // 세포질은 모계 유전 (모본에서 상속)
        const offspringCytoplasm = mother.cytoplasm;
        const offspringCMSType = mother.cmsType;

        // 유전자형 생성 (마커별 배우자 조합)
        const offspringGenotype = this._combineGenotypes(mother.genotype, father.genotype);

        // Rf 유전자 조합
        const offspringRfGenes = this._combineRfGenes(
            mother.genotype.rfGenes,
            father.genotype.rfGenes
        );
        offspringGenotype.rfGenes = offspringRfGenes;

        // 표현형 (ML 예측 또는 멘델 규칙)
        const offspringPhenotype = this._predictF1Phenotype(
            mother.phenotype,
            father.phenotype,
            offspringGenotype
        );

        // RicePlant 클래스 사용 (브라우저 환경 호환)
        const RicePlantClass = window.BDSS?.RicePlant || RicePlant;
        const GenotypeClass = window.BDSS?.Genotype || Genotype;
        const PhenotypeClass = window.BDSS?.Phenotype || Phenotype;

        const offspring = new RicePlantClass({
            id: offspringId,
            name: offspringName,
            genotype: offspringGenotype,
            phenotype: offspringPhenotype,
            cytoplasm: offspringCytoplasm,
            cmsType: offspringCMSType,
            origin: `${mother.name} × ${father.name}`,
            pedigree: [mother.id, father.id],
            generation: 'F1'
        });

        console.log(`[CrossingEngine] F1 생성: ${offspring.name}, 세포질: ${offspringCytoplasm}`);

        return offspring;
    }

    /**
     * 유전자형 조합 (배우자 결합)
     * @private
     */
    _combineGenotypes(motherGenotype, fatherGenotype) {
        const GenotypeClass = window.BDSS?.Genotype || Genotype;
        const combinedMarkers = {};

        // 모든 마커 수집
        const allMarkers = new Set([
            ...Object.keys(motherGenotype.markers),
            ...Object.keys(fatherGenotype.markers)
        ]);

        for (const marker of allMarkers) {
            const motherAllele = motherGenotype.getMarker(marker);
            const fatherAllele = fatherGenotype.getMarker(marker);

            combinedMarkers[marker] = this._combineAlleles(motherAllele, fatherAllele);
        }

        return new GenotypeClass(combinedMarkers);
    }

    /**
     * 대립유전자 조합
     * @private
     */
    _combineAlleles(motherAllele, fatherAllele) {
        // 결측치 처리
        if (motherAllele === '-' || fatherAllele === '-') {
            return motherAllele === '-' ? fatherAllele : motherAllele;
        }

        // 동일 동형접합 (A×A 또는 B×B)
        if (motherAllele === fatherAllele) {
            return motherAllele;
        }

        // 동형접합 × 동형접합 (A×B 또는 B×A)
        if ((motherAllele === 'A' && fatherAllele === 'B') ||
            (motherAllele === 'B' && fatherAllele === 'A')) {
            return 'H';  // 이형접합
        }

        // 이형접합 포함 (H × anything)
        if (motherAllele === 'H' || fatherAllele === 'H') {
            // 멘델리안 분리 (랜덤)
            const alleles = [];

            // 모본 배우자
            if (motherAllele === 'H') {
                alleles.push(Math.random() < 0.5 ? 'A' : 'B');
            } else {
                alleles.push(motherAllele);
            }

            // 부본 배우자
            if (fatherAllele === 'H') {
                alleles.push(Math.random() < 0.5 ? 'A' : 'B');
            } else {
                alleles.push(fatherAllele);
            }

            // 조합
            if (alleles[0] === alleles[1]) {
                return alleles[0];
            }
            return 'H';
        }

        return 'H';  // 기본값: 이형접합
    }

    /**
     * Rf 유전자 조합
     * @private
     */
    _combineRfGenes(motherRfGenes, fatherRfGenes) {
        const RfGeneClass = window.BDSS?.RfGene || RfGene;
        const combinedRf = [];

        // 모든 Rf 유전자 이름 수집
        const allRfNames = new Set([
            ...motherRfGenes.map(rf => rf.name),
            ...fatherRfGenes.map(rf => rf.name)
        ]);

        for (const rfName of allRfNames) {
            const motherRf = motherRfGenes.find(rf => rf.name === rfName);
            const fatherRf = fatherRfGenes.find(rf => rf.name === rfName);

            // 배우자 생성
            const motherGamete = motherRf ? motherRf.produceGamete() : 'r';
            const fatherGamete = fatherRf ? fatherRf.produceGamete() : 'r';

            // 타겟 CMS 합집합
            const targetCMS = [
                ...(motherRf?.targetCMS || []),
                ...(fatherRf?.targetCMS || [])
            ].filter((v, i, a) => a.indexOf(v) === i);  // 중복 제거

            const restorationPower = Math.max(
                motherRf?.restorationPower || 0,
                fatherRf?.restorationPower || 0
            );

            combinedRf.push(new RfGeneClass(
                rfName,
                motherGamete,
                fatherGamete,
                targetCMS,
                restorationPower
            ));
        }

        return combinedRf;
    }

    /**
     * F1 표현형 예측
     * @private
     */
    _predictF1Phenotype(motherPhenotype, fatherPhenotype, offspringGenotype) {
        const PhenotypeClass = window.BDSS?.Phenotype || Phenotype;
        const predictedTraits = {};

        // 모든 형질 수집
        const allTraits = new Set([
            ...motherPhenotype.traitNames,
            ...fatherPhenotype.traitNames
        ]);

        for (const trait of allTraits) {
            const motherValue = motherPhenotype.getTrait(trait);
            const fatherValue = fatherPhenotype.getTrait(trait);

            if (typeof motherValue === 'number' && typeof fatherValue === 'number') {
                // 양적 형질: 중간 값 (약간의 이형접합 강세)
                const midValue = (motherValue + fatherValue) / 2;
                const heterosis = midValue * 0.05 * offspringGenotype.heterozygosity;  // 5% 이형접합 강세
                predictedTraits[trait] = midValue + heterosis;
            } else {
                // 질적 형질: 우성 또는 중간
                predictedTraits[trait] = motherValue || fatherValue;
            }
        }

        return new PhenotypeClass(predictedTraits);
    }

    /**
     * F2 집단 생성 (분리왜곡 포함)
     * @param {RicePlant} f1 - F1 개체
     * @param {number} populationSize - 집단 크기
     * @param {Object} options - 옵션
     * @returns {RicePlant[]} F2 집단
     */
    generateF2Population(f1, populationSize = 100, options = {}) {
        console.log(`[CrossingEngine] F2 집단 생성 시작: ${f1.name}, 크기: ${populationSize}`);

        const f2Population = [];
        const temperature = options.temperature || 25;
        const applyDistortion = options.applyDistortion !== false;

        // F1 자가수정
        for (let i = 0; i < populationSize; i++) {
            const f2 = this._selfPollinate(f1, i, temperature, applyDistortion);
            f2Population.push(f2);
        }

        // 분리왜곡 통계
        if (applyDistortion && f1.hasSterileCytoplasm) {
            const distortionStats = this._calculateDistortionStats(f2Population);
            console.log(`[CrossingEngine] F2 분리왜곡 통계:`, distortionStats);
        }

        console.log(`[CrossingEngine] F2 집단 생성 완료: ${f2Population.length}개체`);

        return f2Population;
    }

    /**
     * 자가수분 (F1 → F2)
     * @private
     */
    _selfPollinate(f1, index, temperature, applyDistortion) {
        const RicePlantClass = window.BDSS?.RicePlant || RicePlant;
        const GenotypeClass = window.BDSS?.Genotype || Genotype;
        const PhenotypeClass = window.BDSS?.Phenotype || Phenotype;

        // 분리왜곡 계수 결정
        let distortionCoeff = 0;
        if (applyDistortion && f1.hasSterileCytoplasm) {
            distortionCoeff = this.segregationDistortionCoeff;
        }

        // 마커별 분리
        const f2Markers = {};
        for (const [marker, allele] of Object.entries(f1.genotype.markers)) {
            f2Markers[marker] = this._segregateAllele(allele, distortionCoeff);
        }

        // Rf 유전자 분리 (S 세포질에서 왜곡)
        const f2RfGenes = this._segregateRfGenes(
            f1.genotype.rfGenes,
            f1.hasSterileCytoplasm,
            distortionCoeff
        );

        const f2Genotype = new GenotypeClass(f2Markers, f2RfGenes);

        // F2 표현형 (멘델 규칙 기반 예측)
        const f2Phenotype = this._predictF2Phenotype(f1.phenotype, f2Genotype);

        const f2 = new RicePlantClass({
            id: `F2_${f1.id}_${index}`,
            name: `${f1.name}_F2_${index + 1}`,
            genotype: f2Genotype,
            phenotype: f2Phenotype,
            cytoplasm: f1.cytoplasm,  // 모계 유전
            cmsType: f1.cmsType,
            origin: `Self(${f1.name})`,
            pedigree: [f1.id],
            generation: 'F2'
        });

        return f2;
    }

    /**
     * 대립유전자 분리 (자가수분)
     * @private
     */
    _segregateAllele(allele, distortionCoeff = 0) {
        // 동형접합이면 변화 없음
        if (allele === 'A' || allele === 'B' || allele === '-') {
            return allele;
        }

        // 이형접합(H)이면 멘델리안 분리 (1:2:1)
        // 분리왜곡 적용: (1+d):2:(1-d)
        const rand = Math.random();
        const totalWeight = (1 + distortionCoeff) + 2 + (1 - distortionCoeff);

        const threshold1 = (1 + distortionCoeff) / totalWeight;
        const threshold2 = threshold1 + 2 / totalWeight;

        if (rand < threshold1) {
            return 'A';  // AA (증가)
        } else if (rand < threshold2) {
            return 'H';  // Aa
        } else {
            return 'B';  // aa (감소)
        }
    }

    /**
     * Rf 유전자 분리 (분리왜곡 포함)
     * @private
     */
    _segregateRfGenes(parentRfGenes, hasSterileCytoplasm, distortionCoeff) {
        const RfGeneClass = window.BDSS?.RfGene || RfGene;
        const segregatedRf = [];

        for (const parentRf of parentRfGenes) {
            // 분리왜곡은 S 세포질에서만 적용
            const applyDistortion = hasSterileCytoplasm && parentRf.isHeterozygous;
            const coeff = applyDistortion ? distortionCoeff : 0;

            // Rf 대립유전자 분리
            const gamete1 = this._produceDistortedGamete(parentRf, coeff);
            const gamete2 = this._produceDistortedGamete(parentRf, coeff);

            segregatedRf.push(new RfGeneClass(
                parentRf.name,
                gamete1,
                gamete2,
                parentRf.targetCMS,
                parentRf.restorationPower
            ));
        }

        return segregatedRf;
    }

    /**
     * 분리왜곡된 배우자 생성
     * @private
     */
    _produceDistortedGamete(rfGene, distortionCoeff) {
        if (rfGene.isHomozygousDominant) return 'R';
        if (rfGene.isHomozygousRecessive) return 'r';

        // 이형접합: 분리왜곡 적용
        // R 배우자가 선호됨 (가임 배우자 선택적 전달)
        const rProbability = 0.5 + (distortionCoeff * 0.5);  // R 확률 증가
        return Math.random() < rProbability ? 'R' : 'r';
    }

    /**
     * F2 표현형 예측
     * @private
     */
    _predictF2Phenotype(parentPhenotype, f2Genotype) {
        const PhenotypeClass = window.BDSS?.Phenotype || Phenotype;
        const predictedTraits = {};

        for (const trait of parentPhenotype.traitNames) {
            const parentValue = parentPhenotype.getTrait(trait);

            if (typeof parentValue === 'number') {
                // 양적 형질: F2 분산 증가 (1/4 가산 분산)
                const variance = parentValue * 0.1;  // 10% 변이
                const randomEffect = (Math.random() - 0.5) * 2 * variance;
                predictedTraits[trait] = parentValue + randomEffect;
            } else {
                predictedTraits[trait] = parentValue;
            }
        }

        return new PhenotypeClass(predictedTraits);
    }

    /**
     * 분리왜곡 통계 계산
     * @private
     */
    _calculateDistortionStats(f2Population) {
        const stats = {
            totalCount: f2Population.length,
            rfGenotypes: {},
            observedRatio: {},
            expectedRatio: { 'RR': 0.25, 'Rr': 0.50, 'rr': 0.25 }
        };

        // Rf 유전자형별 카운트
        for (const plant of f2Population) {
            for (const rf of plant.genotype.rfGenes) {
                const genotype = rf.genotype;
                stats.rfGenotypes[rf.name] = stats.rfGenotypes[rf.name] || {};
                stats.rfGenotypes[rf.name][genotype] = (stats.rfGenotypes[rf.name][genotype] || 0) + 1;
            }
        }

        // 비율 계산
        for (const [rfName, counts] of Object.entries(stats.rfGenotypes)) {
            const total = Object.values(counts).reduce((a, b) => a + b, 0);
            stats.observedRatio[rfName] = {};
            for (const [genotype, count] of Object.entries(counts)) {
                stats.observedRatio[rfName][genotype] = (count / total).toFixed(3);
            }
        }

        return stats;
    }

    /**
     * 교배 방향 추천
     * @param {RicePlant} plant1 - 품종 1
     * @param {RicePlant} plant2 - 품종 2
     * @returns {Object} 추천 결과
     */
    recommendCrossDirection(plant1, plant2) {
        console.log(`[CrossingEngine] 교배 방향 추천: ${plant1.name} vs ${plant2.name}`);

        const directions = [
            { mother: plant1, father: plant2, label: `${plant1.name} ♀ × ${plant2.name} ♂` },
            { mother: plant2, father: plant1, label: `${plant2.name} ♀ × ${plant1.name} ♂` }
        ];

        const evaluations = directions.map(dir => {
            const validation = this.validateCross(dir.mother, dir.father);

            // 점수 계산
            let score = 100;

            // 유효하지 않으면 0점
            if (!validation.isValid) {
                score = 0;
            } else {
                // 경고당 -10점
                score -= validation.warnings.length * 10;

                // 모계 효과 유전자가 있으면 보너스
                if (dir.mother.genotype.maternalGenes.length > 0) {
                    score += 15;
                }

                // CMS 계통이 모본이면 보너스 (종자 생산 효율)
                if (dir.mother.isCMSLine) {
                    score += 10;
                }
            }

            return {
                ...dir,
                isValid: validation.isValid,
                reason: validation.reason,
                warnings: validation.warnings,
                deadEndType: validation.deadEndType,
                score: Math.max(0, score)
            };
        });

        // 점수 순 정렬
        evaluations.sort((a, b) => b.score - a.score);

        const recommendation = {
            recommended: evaluations[0],
            alternative: evaluations[1],
            reasoning: []
        };

        // 추천 이유 생성
        if (evaluations[0].isValid && !evaluations[1].isValid) {
            recommendation.reasoning.push(`${evaluations[0].label}만 유효한 교배입니다.`);
            recommendation.reasoning.push(`역방향 불가 이유: ${evaluations[1].reason}`);
        } else if (evaluations[0].isValid && evaluations[1].isValid) {
            if (evaluations[0].score > evaluations[1].score) {
                recommendation.reasoning.push(`${evaluations[0].label}이 더 높은 점수(${evaluations[0].score}점)를 받았습니다.`);

                if (evaluations[0].mother.genotype.maternalGenes.length > 0) {
                    recommendation.reasoning.push(`모계 효과 유전자 존재로 종자 형질 제어 가능`);
                }

                if (evaluations[0].mother.isCMSLine) {
                    recommendation.reasoning.push(`CMS 계통을 모본으로 사용하여 종자 생산 효율 증가`);
                }
            }
        } else {
            recommendation.reasoning.push('양 방향 모두 문제가 있습니다. 다른 교배 조합을 고려하세요.');
        }

        console.log(`[CrossingEngine] 추천 교배: ${recommendation.recommended.label}`);

        return recommendation;
    }

    /**
     * 연관 불평형 재조합 시뮬레이션
     * @param {Object} haplotype1 - 반수체 1
     * @param {Object} haplotype2 - 반수체 2
     * @param {Array} markerPositions - 마커 위치 [{name, chromosome, position}]
     * @returns {Object} 재조합된 반수체
     */
    simulateRecombination(haplotype1, haplotype2, markerPositions) {
        console.log('[CrossingEngine] 재조합 시뮬레이션 시작');

        // 염색체별 그룹핑
        const chromosomeGroups = {};
        for (const marker of markerPositions) {
            const chr = marker.chromosome;
            if (!chromosomeGroups[chr]) {
                chromosomeGroups[chr] = [];
            }
            chromosomeGroups[chr].push(marker);
        }

        // 염색체별 정렬
        for (const chr in chromosomeGroups) {
            chromosomeGroups[chr].sort((a, b) => a.position - b.position);
        }

        const recombinedHaplotype = {};
        const recombinationEvents = [];

        for (const [chr, markers] of Object.entries(chromosomeGroups)) {
            let currentHaplotype = Math.random() < 0.5 ? 1 : 2;  // 초기 선택

            for (let i = 0; i < markers.length; i++) {
                const marker = markers[i];

                // 이전 마커와의 거리에 따른 재조합 확률
                if (i > 0) {
                    const distance = marker.position - markers[i - 1].position;
                    const recombProb = this._calculateRecombinationProbability(distance);

                    if (Math.random() < recombProb) {
                        // 재조합 발생
                        currentHaplotype = currentHaplotype === 1 ? 2 : 1;
                        recombinationEvents.push({
                            chromosome: chr,
                            position: (marker.position + markers[i - 1].position) / 2,
                            betweenMarkers: [markers[i - 1].name, marker.name]
                        });
                    }
                }

                // 현재 반수체에서 대립유전자 선택
                recombinedHaplotype[marker.name] = currentHaplotype === 1 ?
                    haplotype1[marker.name] : haplotype2[marker.name];
            }
        }

        console.log(`[CrossingEngine] 재조합 이벤트 ${recombinationEvents.length}개 발생`);

        return {
            haplotype: recombinedHaplotype,
            recombinationEvents: recombinationEvents
        };
    }

    /**
     * 거리 기반 재조합 확률 계산 (Haldane 함수)
     * @private
     */
    _calculateRecombinationProbability(distanceCM) {
        // Haldane mapping function: r = 0.5 * (1 - e^(-2d))
        // d = 거리(Morgan), 여기서는 cM이므로 d = distanceCM / 100
        const d = distanceCM / 100;
        return 0.5 * (1 - Math.exp(-2 * d));
    }

    /**
     * 교배 이력 조회
     */
    getCrossHistory() {
        return [...this.crossHistory];
    }

    /**
     * 이력 초기화
     */
    clearHistory() {
        this.crossHistory = [];
        console.log('[CrossingEngine] 교배 이력 초기화');
    }
}


// ============================================================================
// Export
// ============================================================================

if (typeof window !== 'undefined') {
    window.BDSS = window.BDSS || {};
    window.BDSS.CrossingEngine = CrossingEngine;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CrossingEngine };
}
