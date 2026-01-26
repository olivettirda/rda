/**
 * BDSS MAS Marker Selector - MAS 마커 선택 엔진
 *
 * Greedy Algorithm 기반 최소 마커 세트 선택
 * - Set Cover Problem 해결
 * - 연관 드래그 모니터링
 * - 집단 크기 최적화
 */

// ============================================================================
// MAS Marker Selector Class
// ============================================================================

/**
 * MAS 마커 선택기
 *
 * 주요 기능:
 * 1. 최소 마커 세트 선택 (Greedy Set Cover)
 * 2. 연관 드래그 모니터링 (5cM, 10cM, 20cM)
 * 3. 집단 크기 계산
 * 4. 마커 우선순위 결정
 */
class MASMarkerSelector {
    /**
     * @param {Object} config - 설정
     * @param {number} config.confidenceLevel - 신뢰 수준 (기본: 0.95)
     * @param {number[]} config.linkageDragDistances - 연관 드래그 모니터링 거리 (cM)
     */
    constructor(config = {}) {
        this.confidenceLevel = config.confidenceLevel || 0.95;
        this.linkageDragDistances = config.linkageDragDistances || [5, 10, 20];
        this.selectionHistory = [];

        console.log('[MASMarkerSelector] 초기화 완료, 신뢰 수준:', this.confidenceLevel);
    }

    /**
     * 최소 마커 세트 선택 (Greedy Algorithm)
     * @param {Array} targetGenes - 목표 유전자 목록 [{name, chromosome, position}]
     * @param {Array} availableMarkers - 사용 가능한 마커 목록 [{name, chromosome, position, linkedGenes}]
     * @param {Object} options - 옵션
     * @returns {Object} 선택된 마커 세트 및 분석 결과
     */
    selectMinimumMarkerSet(targetGenes, availableMarkers, options = {}) {
        console.log(`[MASMarkerSelector] 최소 마커 세트 선택 시작`);
        console.log(`[MASMarkerSelector] 목표 유전자: ${targetGenes.length}개, 가용 마커: ${availableMarkers.length}개`);

        const maxMarkers = options.maxMarkers || 20;
        const minCoverage = options.minCoverage || 1.0;  // 100% 커버리지 기본

        // 1. 마커-유전자 연관성 매트릭스 생성
        const linkageMatrix = this._buildLinkageMatrix(targetGenes, availableMarkers);

        // 2. Greedy Set Cover 알고리즘
        const selectedMarkers = this._greedySetCover(
            targetGenes,
            availableMarkers,
            linkageMatrix,
            maxMarkers,
            minCoverage
        );

        // 3. 연관 드래그 분석
        const linkageDragAnalysis = this._analyzeLinkageDrag(selectedMarkers, targetGenes);

        // 4. 집단 크기 계산
        const populationSize = this._calculatePopulationSize(selectedMarkers);

        // 5. 결과 구성
        const result = {
            selectedMarkers: selectedMarkers,
            coverage: this._calculateCoverage(selectedMarkers, targetGenes),
            totalMarkers: selectedMarkers.length,
            targetGenesCovered: this._getCoveredGenes(selectedMarkers, targetGenes),
            linkageDragAnalysis: linkageDragAnalysis,
            recommendedPopulationSize: populationSize,
            efficiency: {
                markersPerGene: selectedMarkers.length / Math.max(1, targetGenes.length),
                coveragePerMarker: this._calculateCoverage(selectedMarkers, targetGenes) / Math.max(1, selectedMarkers.length)
            }
        };

        // 이력 기록
        this.selectionHistory.push({
            timestamp: new Date().toISOString(),
            targetGenes: targetGenes.map(g => g.name),
            selectedMarkers: selectedMarkers.map(m => m.name),
            coverage: result.coverage
        });

        console.log(`[MASMarkerSelector] 선택 완료: ${selectedMarkers.length}개 마커, 커버리지: ${(result.coverage * 100).toFixed(1)}%`);

        return result;
    }

    /**
     * 연관성 매트릭스 생성
     * @private
     */
    _buildLinkageMatrix(targetGenes, availableMarkers) {
        const matrix = {};

        for (const marker of availableMarkers) {
            matrix[marker.name] = {};

            for (const gene of targetGenes) {
                // 동일 염색체인지 확인
                if (marker.chromosome !== gene.chromosome) {
                    matrix[marker.name][gene.name] = { linked: false, distance: Infinity };
                    continue;
                }

                // 유전적 거리 계산 (cM)
                const distance = Math.abs(marker.position - gene.position);

                // 연관 판정 (20cM 이내를 연관으로 간주)
                const linked = distance <= 20;

                matrix[marker.name][gene.name] = {
                    linked: linked,
                    distance: distance,
                    linkageStrength: linked ? this._calculateLinkageStrength(distance) : 0
                };
            }
        }

        return matrix;
    }

    /**
     * 연관 강도 계산 (거리 기반)
     * @private
     */
    _calculateLinkageStrength(distanceCM) {
        // Haldane 함수 역산: 재조합율 → 연관 강도
        // 0cM = 1.0 (완전 연관), 50cM = 0 (독립)
        const recombRate = 0.5 * (1 - Math.exp(-2 * distanceCM / 100));
        return 1 - 2 * recombRate;  // 연관 강도 (0-1)
    }

    /**
     * Greedy Set Cover 알고리즘
     * @private
     */
    _greedySetCover(targetGenes, availableMarkers, linkageMatrix, maxMarkers, minCoverage) {
        const selected = [];
        const uncoveredGenes = new Set(targetGenes.map(g => g.name));
        const targetCount = targetGenes.length;

        console.log(`[MASMarkerSelector] Greedy Set Cover 시작, 목표 커버리지: ${(minCoverage * 100).toFixed(0)}%`);

        while (selected.length < maxMarkers && uncoveredGenes.size > 0) {
            // 현재 커버리지 확인
            const currentCoverage = 1 - (uncoveredGenes.size / targetCount);
            if (currentCoverage >= minCoverage) {
                console.log(`[MASMarkerSelector] 목표 커버리지 달성: ${(currentCoverage * 100).toFixed(1)}%`);
                break;
            }

            // 최적 마커 찾기 (가장 많은 미커버 유전자를 커버하는 마커)
            let bestMarker = null;
            let bestScore = -Infinity;
            let bestCoveredGenes = [];

            for (const marker of availableMarkers) {
                // 이미 선택된 마커 제외
                if (selected.some(m => m.name === marker.name)) continue;

                // 이 마커가 커버하는 유전자들
                const coveredGenes = [];
                let totalLinkageStrength = 0;

                for (const geneName of uncoveredGenes) {
                    const linkage = linkageMatrix[marker.name][geneName];
                    if (linkage && linkage.linked) {
                        coveredGenes.push(geneName);
                        totalLinkageStrength += linkage.linkageStrength;
                    }
                }

                // 점수 계산 (커버 수 + 연관 강도 보너스)
                const score = coveredGenes.length + (totalLinkageStrength * 0.1);

                if (score > bestScore) {
                    bestScore = score;
                    bestMarker = marker;
                    bestCoveredGenes = coveredGenes;
                }
            }

            // 마커 선택 불가 시 종료
            if (!bestMarker || bestCoveredGenes.length === 0) {
                console.log('[MASMarkerSelector] 더 이상 커버 가능한 마커 없음');
                break;
            }

            // 마커 선택
            selected.push({
                ...bestMarker,
                coveredGenes: bestCoveredGenes,
                selectionOrder: selected.length + 1
            });

            // 커버된 유전자 제거
            for (const gene of bestCoveredGenes) {
                uncoveredGenes.delete(gene);
            }

            console.log(`[MASMarkerSelector] 마커 ${selected.length} 선택: ${bestMarker.name}, 커버: ${bestCoveredGenes.length}개 유전자`);
        }

        return selected;
    }

    /**
     * 커버리지 계산
     * @private
     */
    _calculateCoverage(selectedMarkers, targetGenes) {
        const coveredGenes = new Set();

        for (const marker of selectedMarkers) {
            if (marker.coveredGenes) {
                for (const gene of marker.coveredGenes) {
                    coveredGenes.add(gene);
                }
            }
        }

        return coveredGenes.size / Math.max(1, targetGenes.length);
    }

    /**
     * 커버된 유전자 목록
     * @private
     */
    _getCoveredGenes(selectedMarkers, targetGenes) {
        const coveredGenes = new Set();

        for (const marker of selectedMarkers) {
            if (marker.coveredGenes) {
                for (const gene of marker.coveredGenes) {
                    coveredGenes.add(gene);
                }
            }
        }

        return Array.from(coveredGenes);
    }

    /**
     * 연관 드래그 분석
     * @private
     */
    _analyzeLinkageDrag(selectedMarkers, targetGenes) {
        const analysis = {};

        for (const marker of selectedMarkers) {
            const dragAnalysis = {
                targetGene: marker.coveredGenes?.[0] || 'unknown',
                markerPosition: marker.position,
                chromosome: marker.chromosome,
                dragZones: {}
            };

            // 각 거리에서의 드래그 분석
            for (const distance of this.linkageDragDistances) {
                const leftBound = marker.position - distance;
                const rightBound = marker.position + distance;

                // 해당 범위 내의 다른 유전자/마커 확인
                const genesInRange = targetGenes.filter(g =>
                    g.chromosome === marker.chromosome &&
                    g.position >= leftBound &&
                    g.position <= rightBound &&
                    g.name !== marker.coveredGenes?.[0]
                );

                dragAnalysis.dragZones[`${distance}cM`] = {
                    range: { left: leftBound, right: rightBound },
                    genesInRange: genesInRange.map(g => g.name),
                    potentialDrag: genesInRange.length > 0
                };
            }

            analysis[marker.name] = dragAnalysis;
        }

        return analysis;
    }

    /**
     * 필요 집단 크기 계산
     *
     * 공식: N = ln(1-P) / ln(1-p)
     * P = 목표 확률 (신뢰 수준)
     * p = 목표 유전자형 빈도
     *
     * @private
     */
    _calculatePopulationSize(selectedMarkers) {
        if (selectedMarkers.length === 0) return 0;

        const P = this.confidenceLevel;  // 목표 확률 (예: 0.95)

        // 각 마커가 목표 유전자형을 가질 확률 (동형접합 기준)
        // F2에서 특정 마커 동형접합 확률: 0.25 (AA 또는 aa)
        const probPerMarker = 0.25;

        // 전체 마커 조합 확률 (독립 가정)
        const totalMarkers = selectedMarkers.length;
        const p = Math.pow(probPerMarker, totalMarkers);

        // 필요 집단 크기
        const N = Math.ceil(Math.log(1 - P) / Math.log(1 - p));

        console.log(`[MASMarkerSelector] 집단 크기 계산: ${totalMarkers}개 마커, p=${p.toExponential(2)}, N=${N}`);

        // 합리적인 범위로 제한
        return Math.min(N, 100000);  // 최대 10만 개체
    }

    /**
     * 배경 선발용 마커 추천
     * @param {string} targetChromosome - 목표 유전자 염색체
     * @param {number} targetPosition - 목표 유전자 위치
     * @param {Array} allMarkers - 전체 마커 목록
     * @param {number} desiredRecovery - 목표 회복율 (기본: 0.95)
     * @returns {Array} 배경 선발 마커 목록
     */
    selectBackgroundMarkers(targetChromosome, targetPosition, allMarkers, desiredRecovery = 0.95) {
        console.log(`[MASMarkerSelector] 배경 마커 선택: Chr${targetChromosome}:${targetPosition}`);

        // 염색체별 그룹핑
        const chromosomeGroups = {};
        for (const marker of allMarkers) {
            const chr = marker.chromosome;
            if (!chromosomeGroups[chr]) {
                chromosomeGroups[chr] = [];
            }
            chromosomeGroups[chr].push(marker);
        }

        const backgroundMarkers = [];

        // 각 염색체에서 대표 마커 선택
        for (const [chr, markers] of Object.entries(chromosomeGroups)) {
            // 마커를 위치순 정렬
            markers.sort((a, b) => a.position - b.position);

            if (chr === targetChromosome.toString()) {
                // 목표 염색체: 목표 유전자 양쪽에 배치 (연관 드래그 모니터링)
                const leftMarkers = markers.filter(m => m.position < targetPosition - 5);
                const rightMarkers = markers.filter(m => m.position > targetPosition + 5);

                // 좌측 대표 마커 (목표에서 가장 가까운)
                if (leftMarkers.length > 0) {
                    const leftRep = leftMarkers[leftMarkers.length - 1];
                    backgroundMarkers.push({
                        ...leftRep,
                        purpose: 'linkage_drag_left',
                        distanceFromTarget: targetPosition - leftRep.position
                    });
                }

                // 우측 대표 마커
                if (rightMarkers.length > 0) {
                    const rightRep = rightMarkers[0];
                    backgroundMarkers.push({
                        ...rightRep,
                        purpose: 'linkage_drag_right',
                        distanceFromTarget: rightRep.position - targetPosition
                    });
                }
            } else {
                // 비목표 염색체: 균등 분포로 2-3개 마커 선택
                const numMarkers = Math.min(3, markers.length);
                const interval = Math.floor(markers.length / numMarkers);

                for (let i = 0; i < numMarkers; i++) {
                    const idx = Math.min(i * interval, markers.length - 1);
                    backgroundMarkers.push({
                        ...markers[idx],
                        purpose: 'background_recovery',
                        distanceFromTarget: null
                    });
                }
            }
        }

        // 필요 세대 수 계산 (목표 회복율 달성)
        const backgroundCoverage = backgroundMarkers.filter(m => m.purpose === 'background_recovery').length;
        const recoveryPerGeneration = 0.5 + (0.5 * (backgroundCoverage / (backgroundCoverage + 10)));
        const generationsNeeded = Math.ceil(Math.log(1 - desiredRecovery) / Math.log(1 - recoveryPerGeneration));

        console.log(`[MASMarkerSelector] 배경 마커 ${backgroundMarkers.length}개 선택, 예상 ${generationsNeeded}세대 필요`);

        return {
            markers: backgroundMarkers,
            estimatedGenerations: generationsNeeded,
            expectedRecovery: desiredRecovery
        };
    }

    /**
     * 마커 우선순위 결정
     * @param {Array} markers - 마커 목록
     * @param {Object} criteria - 우선순위 기준 {polymorphism, reliability, cost}
     * @returns {Array} 우선순위 정렬된 마커 목록
     */
    prioritizeMarkers(markers, criteria = {}) {
        const defaultCriteria = {
            polymorphismWeight: 0.4,   // 다형성 가중치
            reliabilityWeight: 0.3,    // 신뢰성 가중치
            costWeight: 0.3            // 비용 가중치 (낮을수록 좋음)
        };

        const weights = { ...defaultCriteria, ...criteria };

        const scoredMarkers = markers.map(marker => {
            // 기본값 설정
            const polymorphism = marker.polymorphism || 0.5;
            const reliability = marker.reliability || 0.8;
            const cost = marker.cost || 5000;  // 원

            // 점수 계산 (0-100)
            const polymorphismScore = polymorphism * 100;
            const reliabilityScore = reliability * 100;
            const costScore = Math.max(0, 100 - (cost / 100));  // 비용 역수

            const totalScore =
                polymorphismScore * weights.polymorphismWeight +
                reliabilityScore * weights.reliabilityWeight +
                costScore * weights.costWeight;

            return {
                ...marker,
                priorityScore: totalScore,
                scoreBreakdown: {
                    polymorphism: polymorphismScore,
                    reliability: reliabilityScore,
                    cost: costScore
                }
            };
        });

        // 점수 내림차순 정렬
        scoredMarkers.sort((a, b) => b.priorityScore - a.priorityScore);

        console.log(`[MASMarkerSelector] 마커 우선순위 결정: 상위 마커 ${scoredMarkers[0]?.name} (${scoredMarkers[0]?.priorityScore.toFixed(1)}점)`);

        return scoredMarkers;
    }

    /**
     * MABC 세대별 선발 전략
     * @param {number} generation - 여교잡 세대 (BC1, BC2, ...)
     * @param {Array} foregroundMarkers - 전경 선발 마커
     * @param {Array} backgroundMarkers - 배경 선발 마커
     * @returns {Object} 선발 전략
     */
    getMABCSelectionStrategy(generation, foregroundMarkers, backgroundMarkers) {
        const strategy = {
            generation: `BC${generation}`,
            foreground: {
                markers: foregroundMarkers,
                selectionCriteria: 'heterozygous',  // 이형접합 선발
                priority: 'mandatory'
            },
            background: {
                markers: [],
                selectionCriteria: 'recurrent_parent',  // 반복친 동형접합
                priority: 'high'
            },
            linkageDrag: {
                markers: [],
                selectionCriteria: 'recurrent_parent',
                priority: 'medium'
            },
            populationSize: 0,
            expectedRecovery: 0
        };

        // 세대별 전략 조정
        switch (generation) {
            case 1:
                // BC1: 전경 선발 집중, 배경은 최소
                strategy.background.markers = backgroundMarkers.slice(0, 5);
                strategy.populationSize = 200;
                strategy.expectedRecovery = 0.75;
                break;

            case 2:
                // BC2: 전경 + 배경 균형
                strategy.background.markers = backgroundMarkers.slice(0, 10);
                strategy.linkageDrag.markers = backgroundMarkers.filter(m => m.purpose === 'linkage_drag_left' || m.purpose === 'linkage_drag_right');
                strategy.populationSize = 300;
                strategy.expectedRecovery = 0.875;
                break;

            case 3:
                // BC3: 배경 회복 집중
                strategy.background.markers = backgroundMarkers;
                strategy.linkageDrag.markers = backgroundMarkers.filter(m => m.distanceFromTarget !== null);
                strategy.populationSize = 400;
                strategy.expectedRecovery = 0.9375;
                break;

            default:
                // BC4 이상: 연관 드래그 집중
                strategy.background.markers = backgroundMarkers;
                strategy.linkageDrag.markers = backgroundMarkers.filter(m => m.distanceFromTarget !== null);
                strategy.linkageDrag.priority = 'high';
                strategy.populationSize = 500;
                strategy.expectedRecovery = Math.min(0.99, 1 - Math.pow(0.5, generation + 1));
        }

        console.log(`[MASMarkerSelector] ${strategy.generation} 전략: 집단 크기 ${strategy.populationSize}, 예상 회복율 ${(strategy.expectedRecovery * 100).toFixed(1)}%`);

        return strategy;
    }

    /**
     * 선택 이력 조회
     */
    getSelectionHistory() {
        return [...this.selectionHistory];
    }
}


// ============================================================================
// Export
// ============================================================================

if (typeof window !== 'undefined') {
    window.BDSS = window.BDSS || {};
    window.BDSS.MASMarkerSelector = MASMarkerSelector;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MASMarkerSelector };
}
