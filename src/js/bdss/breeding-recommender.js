/**
 * BDSS Breeding Method Recommender - 육종 방법 추천 엔진
 *
 * 결정 트리 기반 육종 방법 선택:
 * - Pedigree: 고유전력 질적 형질
 * - SSD: 저유전력 양적 형질 (Speed Breeding 시)
 * - Bulk: 저예산, 대규모 집단
 * - DH: 시간 제약, 반수체 시설 보유
 * - MABC: 주동 유전자 도입
 */

// ============================================================================
// Cost Parameters (비용 매개변수)
// ============================================================================

const BREEDING_COSTS = {
    pedigree: {
        costPerYear: 15000000,      // 연간 1,500만 원
        yearsToRelease: 8,          // 품종 등록까지 8년
        laborIntensity: 0.9,        // 노동 집약도 (높음)
        fieldRequirement: 1.0       // 포장 요구량 (표준)
    },
    ssd: {
        costPerYear: 10000000,      // 연간 1,000만 원
        yearsToRelease: 6,          // Speed Breeding 시 6년
        yearsWithoutSB: 10,         // Speed Breeding 없이 10년
        laborIntensity: 0.3,        // 노동 집약도 (낮음)
        fieldRequirement: 0.5       // 포장 요구량 (낮음)
    },
    bulk: {
        costPerYear: 8000000,       // 연간 800만 원
        yearsToRelease: 10,         // 품종 등록까지 10년
        laborIntensity: 0.2,        // 노동 집약도 (최저)
        fieldRequirement: 1.5       // 포장 요구량 (높음)
    },
    dh: {
        costPerYear: 50000000,      // 연간 5,000만 원 (조직배양 비용)
        yearsToRelease: 4,          // 품종 등록까지 4년
        laborIntensity: 0.6,        // 노동 집약도 (중간)
        fieldRequirement: 0.3       // 포장 요구량 (최저)
    },
    mabc: {
        costPerYear: 40000000,      // 연간 4,000만 원 (마커 분석 비용)
        yearsToRelease: 5,          // 품종 등록까지 5년
        laborIntensity: 0.7,        // 노동 집약도 (중상)
        fieldRequirement: 0.4,      // 포장 요구량 (낮음)
        markerCostPerSample: 5000   // 샘플당 마커 분석 비용
    },
    mars: {
        costPerYear: 60000000,      // 연간 6,000만 원
        yearsToRelease: 6,          // 품종 등록까지 6년
        laborIntensity: 0.8,        // 노동 집약도 (높음)
        fieldRequirement: 0.6       // 포장 요구량 (중간)
    }
};


// ============================================================================
// Breeding Method Recommender Class
// ============================================================================

/**
 * 육종 방법 추천 엔진
 */
class BreedingMethodRecommender {
    /**
     * @param {Object} config - 설정
     */
    constructor(config = {}) {
        this.defaultYieldWeight = config.yieldWeight || 0.6;
        this.defaultStabilityWeight = config.stabilityWeight || 0.4;
        this.costs = { ...BREEDING_COSTS, ...(config.costs || {}) };

        console.log('[BreedingMethodRecommender] 초기화 완료');
    }

    /**
     * 육종 방법 추천
     * @param {BreedingProgramConfig} programConfig - 육종 프로그램 설정
     * @param {Object} heritabilities - {형질명: 유전력}
     * @param {Object} traitTypes - {형질명: TraitType}
     * @returns {Object} 추천 결과
     */
    recommend(programConfig, heritabilities, traitTypes) {
        console.log(`[BreedingMethodRecommender] 추천 시작: ${programConfig.programName}`);
        console.log('[BreedingMethodRecommender] 유전력:', JSON.stringify(heritabilities, null, 2));
        console.log('[BreedingMethodRecommender] 형질 유형:', JSON.stringify(traitTypes, null, 2));

        const decisionPath = [];
        const scores = {};
        const costAnalysis = {};

        // 모든 방법에 대해 점수 계산
        const methods = ['pedigree', 'ssd', 'bulk', 'dh', 'mabc', 'mars'];

        for (const method of methods) {
            const evaluation = this._evaluateMethod(
                method,
                programConfig,
                heritabilities,
                traitTypes
            );
            scores[method] = evaluation.score;
            costAnalysis[method] = evaluation.costAnalysis;

            console.log(`[BreedingMethodRecommender] ${method}: 점수 ${evaluation.score.toFixed(2)}`);
        }

        // 결정 트리 경로 기록
        this._recordDecisionPath(
            decisionPath,
            programConfig,
            heritabilities,
            traitTypes
        );

        // 최고 점수 방법 선택
        const sortedMethods = Object.entries(scores)
            .sort((a, b) => b[1] - a[1]);

        const recommendedMethod = sortedMethods[0][0];
        const confidenceScore = this._calculateConfidence(sortedMethods);

        // 추천 이유 생성
        const reasoning = this._generateReasoning(
            recommendedMethod,
            programConfig,
            heritabilities,
            traitTypes,
            costAnalysis[recommendedMethod]
        );

        const result = {
            recommended_method: recommendedMethod,
            confidence_score: confidenceScore,
            scores: scores,
            alternative_methods: sortedMethods.slice(1, 4).map(([m, s]) => m),
            decision_path: decisionPath,
            reasoning: reasoning,
            cost_analysis: costAnalysis
        };

        console.log(`[BreedingMethodRecommender] 추천 결과: ${recommendedMethod} (신뢰도: ${(confidenceScore * 100).toFixed(1)}%)`);

        return result;
    }

    /**
     * 특정 방법 평가
     * @private
     */
    _evaluateMethod(method, programConfig, heritabilities, traitTypes) {
        const methodCost = this.costs[method];
        let score = 50;  // 기본 점수

        // 1. 유전력 기반 점수
        const avgHeritability = this._calculateAverageHeritability(heritabilities);
        score += this._getHeritabilityScore(method, avgHeritability);

        // 2. 형질 유형 기반 점수
        const dominantTraitType = this._getDominantTraitType(traitTypes);
        score += this._getTraitTypeScore(method, dominantTraitType);

        // 3. 예산 적합성
        const totalCost = this._estimateTotalCost(method, programConfig);
        if (totalCost > programConfig.budgetLimit) {
            score -= 30;  // 예산 초과 시 대폭 감점
        } else {
            const budgetEfficiency = 1 - (totalCost / programConfig.budgetLimit);
            score += budgetEfficiency * 15;  // 최대 15점 보너스
        }

        // 4. 시간 적합성
        const estimatedYears = this._estimateYears(method, programConfig);
        if (estimatedYears > programConfig.timeLimitYears) {
            score -= 25;  // 시간 초과 시 감점
        } else {
            const timeEfficiency = 1 - (estimatedYears / programConfig.timeLimitYears);
            score += timeEfficiency * 10;  // 최대 10점 보너스
        }

        // 5. 시설 적합성
        score += this._getFacilityScore(method, programConfig);

        // 6. 포장 용량 적합성
        const fieldRequired = methodCost.fieldRequirement * 1000;  // 표준 1000개체 기준
        if (fieldRequired > programConfig.fieldCapacity) {
            score -= 10;
        }

        // 비용 분석
        const costAnalysis = {
            total_cost: totalCost,
            total_years: estimatedYears,
            expected_genetic_gain: this._estimateGeneticGain(method, avgHeritability),
            genetic_gain_per_cost: 0,
            genetic_gain_per_year: 0
        };

        if (totalCost > 0) {
            costAnalysis.genetic_gain_per_cost = costAnalysis.expected_genetic_gain / (totalCost / 100000000);
        }
        if (estimatedYears > 0) {
            costAnalysis.genetic_gain_per_year = costAnalysis.expected_genetic_gain / estimatedYears;
        }

        return {
            score: Math.max(0, Math.min(100, score)),
            costAnalysis: costAnalysis
        };
    }

    /**
     * 평균 유전력 계산
     * @private
     */
    _calculateAverageHeritability(heritabilities) {
        const values = Object.values(heritabilities);
        if (values.length === 0) return 0.5;  // 기본값
        return values.reduce((a, b) => a + b, 0) / values.length;
    }

    /**
     * 지배적 형질 유형 결정
     * @private
     */
    _getDominantTraitType(traitTypes) {
        const TraitType = window.BDSS?.TraitType || { QUALITATIVE: 'qualitative', QUANTITATIVE: 'quantitative' };

        const types = Object.values(traitTypes);
        if (types.length === 0) return TraitType.QUANTITATIVE;

        const qualCount = types.filter(t => t === TraitType.QUALITATIVE || t === 'qualitative').length;
        const quantCount = types.filter(t => t === TraitType.QUANTITATIVE || t === 'quantitative').length;

        return qualCount >= quantCount ? TraitType.QUALITATIVE : TraitType.QUANTITATIVE;
    }

    /**
     * 유전력 기반 점수
     * @private
     */
    _getHeritabilityScore(method, avgHeritability) {
        // 고유전력 (>0.7): Pedigree, MABC 선호
        // 중유전력 (0.4-0.7): DH, MARS 선호
        // 저유전력 (<0.4): SSD, Bulk 선호

        const scores = {
            pedigree: avgHeritability > 0.7 ? 15 : avgHeritability > 0.4 ? 5 : -10,
            ssd: avgHeritability < 0.4 ? 15 : avgHeritability < 0.6 ? 10 : 0,
            bulk: avgHeritability < 0.5 ? 10 : 0,
            dh: avgHeritability > 0.3 ? 10 : 5,  // DH는 유전력 무관
            mabc: avgHeritability > 0.6 ? 15 : avgHeritability > 0.3 ? 5 : -5,
            mars: avgHeritability > 0.4 && avgHeritability < 0.8 ? 15 : 5
        };

        return scores[method] || 0;
    }

    /**
     * 형질 유형 기반 점수
     * @private
     */
    _getTraitTypeScore(method, dominantTraitType) {
        const TraitType = window.BDSS?.TraitType || { QUALITATIVE: 'qualitative', QUANTITATIVE: 'quantitative' };
        const isQualitative = dominantTraitType === TraitType.QUALITATIVE || dominantTraitType === 'qualitative';

        // 질적 형질: Pedigree, MABC 선호
        // 양적 형질: SSD, Bulk, MARS 선호

        const scores = {
            pedigree: isQualitative ? 15 : 5,
            ssd: isQualitative ? 5 : 15,
            bulk: isQualitative ? 0 : 10,
            dh: 10,  // DH는 형질 유형 무관
            mabc: isQualitative ? 20 : 0,  // MABC는 질적 형질에 강력 추천
            mars: isQualitative ? 5 : 15
        };

        return scores[method] || 0;
    }

    /**
     * 시설 적합성 점수
     * @private
     */
    _getFacilityScore(method, programConfig) {
        let score = 0;

        // Speed Breeding 시설
        if (method === 'ssd' && programConfig.hasSpeedBreeding) {
            score += 20;  // SSD + Speed Breeding = 강력 추천
        }

        // DH 시설
        if (method === 'dh') {
            if (programConfig.hasDHFacility) {
                score += 15;
            } else {
                score -= 25;  // DH 시설 없으면 대폭 감점
            }
        }

        // MABC는 마커 분석 시설 필요 (기본 가정)
        if (method === 'mabc' || method === 'mars') {
            // 마커 시설은 외주 가능하므로 감점 없음
        }

        return score;
    }

    /**
     * 총 비용 추정
     * @private
     */
    _estimateTotalCost(method, programConfig) {
        const methodCost = this.costs[method];
        const years = this._estimateYears(method, programConfig);
        return methodCost.costPerYear * years;
    }

    /**
     * 소요 연수 추정
     * @private
     */
    _estimateYears(method, programConfig) {
        const methodCost = this.costs[method];

        if (method === 'ssd') {
            return programConfig.hasSpeedBreeding ?
                methodCost.yearsToRelease :
                methodCost.yearsWithoutSB;
        }

        return methodCost.yearsToRelease;
    }

    /**
     * 유전적 이득 추정 (Breeder's Equation)
     * R = i * h² * σP / L
     * @private
     */
    _estimateGeneticGain(method, avgHeritability) {
        const i = this._getSelectionIntensity(method);  // 선발 강도
        const L = this.costs[method].yearsToRelease;    // 세대 주기
        const sigmaP = 1.0;  // 표현형 표준편차 (표준화)

        // 방법별 보정 계수
        const methodBonus = {
            pedigree: 1.0,
            ssd: 0.9,
            bulk: 0.7,
            dh: 1.2,     // DH는 완전 동형접합
            mabc: 1.3,   // MABC는 정확도 높음
            mars: 1.1
        };

        const R = (i * avgHeritability * sigmaP / L) * (methodBonus[method] || 1.0);
        return Math.max(0, R);
    }

    /**
     * 선발 강도 (i)
     * @private
     */
    _getSelectionIntensity(method) {
        // 선발 비율에 따른 i 값 (표준화)
        const intensities = {
            pedigree: 1.76,  // 10% 선발
            ssd: 1.40,       // 20% 선발
            bulk: 1.16,      // 30% 선발
            dh: 2.06,        // 5% 선발 (적은 집단에서 강한 선발)
            mabc: 1.76,      // 10% 선발
            mars: 1.76       // 10% 선발
        };

        return intensities[method] || 1.40;
    }

    /**
     * 신뢰도 계산
     * @private
     */
    _calculateConfidence(sortedMethods) {
        if (sortedMethods.length < 2) return 1.0;

        const topScore = sortedMethods[0][1];
        const secondScore = sortedMethods[1][1];

        // 점수 차이가 클수록 높은 신뢰도
        const scoreDiff = topScore - secondScore;
        const confidence = Math.min(1.0, 0.5 + (scoreDiff / 100));

        return confidence;
    }

    /**
     * 결정 경로 기록
     * @private
     */
    _recordDecisionPath(decisionPath, programConfig, heritabilities, traitTypes) {
        const TraitType = window.BDSS?.TraitType || { QUALITATIVE: 'qualitative', QUANTITATIVE: 'quantitative' };

        // Node 1: 형질 유형 분류
        const dominantType = this._getDominantTraitType(traitTypes);
        const isQualitative = dominantType === TraitType.QUALITATIVE || dominantType === 'qualitative';

        decisionPath.push(
            `Node 1: 형질 유형 분류 → ${isQualitative ? '질적 형질' : '양적 형질'}`
        );

        // Node 2: 유전력 수준
        const avgHeritability = this._calculateAverageHeritability(heritabilities);
        let heritabilityLevel = '저유전력';
        if (avgHeritability > 0.7) heritabilityLevel = '고유전력';
        else if (avgHeritability > 0.4) heritabilityLevel = '중유전력';

        decisionPath.push(
            `Node 2: 유전력 수준 → ${heritabilityLevel} (h² = ${avgHeritability.toFixed(2)})`
        );

        // Node 3: 시간 제약
        const isUrgent = programConfig.timeLimitYears <= 5;
        decisionPath.push(
            `Node 3: 시간 제약 → ${isUrgent ? '긴급 (' + programConfig.timeLimitYears + '년 이내)' : '일반'}`
        );

        // Node 4: 시설 현황
        const facilities = [];
        if (programConfig.hasSpeedBreeding) facilities.push('Speed Breeding');
        if (programConfig.hasDHFacility) facilities.push('DH 시설');
        decisionPath.push(
            `Node 4: 시설 현황 → ${facilities.length > 0 ? facilities.join(', ') : '기본 시설만'}`
        );

        // Node 5: 예산 수준
        let budgetLevel = '저예산';
        if (programConfig.budgetLimit > 300000000) budgetLevel = '고예산';
        else if (programConfig.budgetLimit > 100000000) budgetLevel = '중예산';

        decisionPath.push(
            `Node 5: 예산 수준 → ${budgetLevel} (${(programConfig.budgetLimit / 100000000).toFixed(1)}억 원)`
        );
    }

    /**
     * 추천 이유 생성
     * @private
     */
    _generateReasoning(method, programConfig, heritabilities, traitTypes, costAnalysis) {
        const TraitType = window.BDSS?.TraitType || { QUALITATIVE: 'qualitative', QUANTITATIVE: 'quantitative' };
        const reasoning = [];

        const avgHeritability = this._calculateAverageHeritability(heritabilities);
        const dominantType = this._getDominantTraitType(traitTypes);
        const isQualitative = dominantType === TraitType.QUALITATIVE || dominantType === 'qualitative';

        // 방법별 추천 이유
        switch (method) {
            case 'pedigree':
                reasoning.push('Pedigree 방법은 초기 세대부터 개체 선발이 가능합니다.');
                if (avgHeritability > 0.6) {
                    reasoning.push(`높은 유전력(h²=${avgHeritability.toFixed(2)})으로 초기 선발 효과가 큽니다.`);
                }
                if (isQualitative) {
                    reasoning.push('질적 형질 개량에 효과적입니다.');
                }
                break;

            case 'ssd':
                reasoning.push('SSD 방법은 빠른 세대 진전이 가능합니다.');
                if (programConfig.hasSpeedBreeding) {
                    reasoning.push('Speed Breeding 시설로 연간 3-4세대 진전이 가능합니다.');
                }
                if (avgHeritability < 0.5) {
                    reasoning.push(`저유전력(h²=${avgHeritability.toFixed(2)}) 형질에 적합합니다.`);
                }
                break;

            case 'bulk':
                reasoning.push('Bulk 방법은 노동력과 비용이 최소화됩니다.');
                reasoning.push('대규모 집단 관리에 적합합니다.');
                break;

            case 'dh':
                reasoning.push('DH(반수체 배가)는 1세대 만에 완전 동형접합체를 얻습니다.');
                if (programConfig.hasDHFacility) {
                    reasoning.push('DH 시설 보유로 신속한 품종 개발이 가능합니다.');
                }
                if (programConfig.timeLimitYears <= 5) {
                    reasoning.push(`긴급 품종 개발(${programConfig.timeLimitYears}년 이내)에 최적입니다.`);
                }
                break;

            case 'mabc':
                reasoning.push('MABC는 특정 유전자 도입에 최적화되어 있습니다.');
                if (isQualitative) {
                    reasoning.push('질적 형질(주동 유전자)의 정확한 도입이 가능합니다.');
                }
                reasoning.push('여교잡을 통해 유전적 배경을 빠르게 회복합니다.');
                break;

            case 'mars':
                reasoning.push('MARS는 다수의 QTL을 동시에 집적할 수 있습니다.');
                if (!isQualitative && avgHeritability > 0.3) {
                    reasoning.push('양적 형질 개량에 효과적입니다.');
                }
                break;
        }

        // 비용 효율성
        if (costAnalysis.total_cost <= programConfig.budgetLimit) {
            reasoning.push(`예산 내 수행 가능 (예상 비용: ${(costAnalysis.total_cost / 100000000).toFixed(1)}억 원)`);
        }

        // 시간 효율성
        if (costAnalysis.total_years <= programConfig.timeLimitYears) {
            reasoning.push(`기한 내 완료 가능 (예상 기간: ${costAnalysis.total_years}년)`);
        }

        return reasoning;
    }

    /**
     * 방법 비교 테이블 생성
     * @param {BreedingProgramConfig} programConfig - 프로그램 설정
     * @param {Object} heritabilities - 유전력
     * @returns {string} 비교 테이블 (텍스트)
     */
    compareMethodsTable(programConfig, heritabilities) {
        const result = this.recommend(programConfig, heritabilities, {});

        let table = '\n=== 육종 방법 비교 ===\n\n';
        table += '방법       | 점수  | 예상 비용    | 예상 기간 | 유전적 이득/년\n';
        table += '-'.repeat(65) + '\n';

        const methods = ['pedigree', 'ssd', 'bulk', 'dh', 'mabc', 'mars'];
        for (const method of methods) {
            const score = result.scores[method];
            const cost = result.cost_analysis[method];

            const methodName = method.padEnd(10);
            const scoreStr = score.toFixed(1).padStart(5);
            const costStr = ((cost.total_cost / 100000000).toFixed(1) + '억').padStart(10);
            const yearsStr = (cost.total_years + '년').padStart(7);
            const gainStr = cost.genetic_gain_per_year.toFixed(3).padStart(12);

            table += `${methodName} | ${scoreStr} | ${costStr} | ${yearsStr} | ${gainStr}\n`;
        }

        table += '\n추천: ' + result.recommended_method.toUpperCase();
        table += ` (신뢰도: ${(result.confidence_score * 100).toFixed(0)}%)\n`;

        return table;
    }

    /**
     * 비교 메서드 (API 호환용)
     */
    compare_methods(programConfig, heritabilities) {
        return this.compareMethodsTable(programConfig, heritabilities);
    }
}


// ============================================================================
// Export
// ============================================================================

if (typeof window !== 'undefined') {
    window.BDSS = window.BDSS || {};
    window.BDSS.BreedingMethodRecommender = BreedingMethodRecommender;
    window.BDSS.BREEDING_COSTS = BREEDING_COSTS;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BreedingMethodRecommender,
        BREEDING_COSTS
    };
}
