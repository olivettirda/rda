"""
BDSS Breeding Method Recommender - 육종 방법 추천 엔진

육종가 방정식 기반으로 최적의 육종 방법을 추천합니다.

핵심 알고리즘:
- 육종가 방정식: ΔG = (i × r × σA) / (L × C)
- 의사결정 트리 로직
- 비용-편익 분석 시뮬레이션
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
from enum import Enum
import numpy as np
import logging

from .models import (
    BreedingMethod, TraitType, BreedingProgramConfig, RicePlant
)

logger = logging.getLogger(__name__)


@dataclass
class BreedingMethodProfile:
    """육종 방법 프로파일"""
    method: BreedingMethod
    name_kr: str

    # 육종가 방정식 파라미터
    typical_cycle_years: float    # L: 품종 완성까지 연수
    selection_accuracy: float     # r: 선발 정확도 (0-1)
    cost_per_plant: float        # 개체당 비용 (원)
    generations_per_year: float  # 연간 세대 진전 수

    # 적합성 조건
    min_heritability: float = 0.0   # 최소 유전력
    max_heritability: float = 1.0   # 최대 유전력
    requires_facility: List[str] = field(default_factory=list)  # 필요 시설

    # 장단점
    advantages: List[str] = field(default_factory=list)
    disadvantages: List[str] = field(default_factory=list)


# 기본 육종 방법 프로파일
DEFAULT_METHOD_PROFILES: Dict[BreedingMethod, BreedingMethodProfile] = {
    BreedingMethod.PEDIGREE: BreedingMethodProfile(
        method=BreedingMethod.PEDIGREE,
        name_kr="계통육종법",
        typical_cycle_years=8,
        selection_accuracy=0.7,
        cost_per_plant=5000,
        generations_per_year=1,
        min_heritability=0.5,
        advantages=[
            "유전력 높은 형질에 대해 초기 선발 정확도 높음",
            "계통 기록 관리 용이",
            "유전적 진전 시각화 가능"
        ],
        disadvantages=[
            "세대 진전 느림",
            "포장 관리 비용 높음",
            "노동력 집약적"
        ]
    ),
    BreedingMethod.BULK: BreedingMethodProfile(
        method=BreedingMethod.BULK,
        name_kr="집단육종법",
        typical_cycle_years=7,
        selection_accuracy=0.4,
        cost_per_plant=2000,
        generations_per_year=1.5,
        min_heritability=0.0,
        advantages=[
            "저비용",
            "자연 선택 활용",
            "유전적 변이 유지"
        ],
        disadvantages=[
            "선발 정확도 낮음",
            "불량 유전자 축적 가능"
        ]
    ),
    BreedingMethod.SSD: BreedingMethodProfile(
        method=BreedingMethod.SSD,
        name_kr="1개체 1립법 (SSD)",
        typical_cycle_years=5,
        selection_accuracy=0.5,
        cost_per_plant=3000,
        generations_per_year=3,
        min_heritability=0.0,
        requires_facility=["온실", "Speed Breeding 시설"],
        advantages=[
            "세대 진전 빠름 (연간 3-4세대)",
            "유전적 변이 유지에 유리",
            "비용 대비 효율적"
        ],
        disadvantages=[
            "초기 세대 선발 불가",
            "불량 유전자 포함 가능"
        ]
    ),
    BreedingMethod.DH: BreedingMethodProfile(
        method=BreedingMethod.DH,
        name_kr="약배양/반수체 배가 (DH)",
        typical_cycle_years=3,
        selection_accuracy=0.9,
        cost_per_plant=50000,
        generations_per_year=1,
        requires_facility=["조직배양실", "항온항습기"],
        advantages=[
            "육종 연한 극단적 단축",
            "완전 호모화로 선발 정확도 상승",
            "열성 유전자 고정 용이"
        ],
        disadvantages=[
            "높은 비용",
            "유전자형 의존적 배양 효율",
            "Indica 품종 난배양성"
        ]
    ),
    BreedingMethod.MABC: BreedingMethodProfile(
        method=BreedingMethod.MABC,
        name_kr="표지인자 이용 여교배 (MABC)",
        typical_cycle_years=4,
        selection_accuracy=0.95,
        cost_per_plant=30000,
        generations_per_year=2,
        requires_facility=["분자마커 분석실"],
        advantages=[
            "배경 회복 속도 빠름",
            "결과 예측 확실성 높음",
            "소수 주동 유전자 도입에 최적"
        ],
        disadvantages=[
            "마커 분석 비용 발생",
            "다인자 형질에 부적합"
        ]
    )
}


@dataclass
class BreedingCostAnalysis:
    """육종 비용-편익 분석 결과"""
    method: BreedingMethod
    total_cost: float           # 총 비용 (원)
    total_years: float          # 총 육종 연수
    expected_genetic_gain: float  # 예상 유전적 이득
    genetic_gain_per_year: float  # 연간 유전적 이득
    genetic_gain_per_cost: float  # 비용당 유전적 이득
    cost_breakdown: Dict[str, float] = field(default_factory=dict)
    roi_estimate: float = 0.0   # 투자 수익률 (%)


@dataclass
class BreedingRecommendation:
    """육종 방법 추천 결과"""
    recommended_method: BreedingMethod
    alternative_methods: List[BreedingMethod]
    confidence_score: float  # 추천 신뢰도 (0-1)
    reasoning: List[str]     # 추천 이유
    cost_analysis: Dict[BreedingMethod, BreedingCostAnalysis]
    decision_path: List[str]  # 의사결정 경로


class BreedingMethodRecommender:
    """
    육종 방법 추천 엔진

    육종가 방정식과 의사결정 트리를 기반으로
    최적의 육종 방법을 추천합니다.
    """

    def __init__(
        self,
        method_profiles: Dict[BreedingMethod, BreedingMethodProfile] = None
    ):
        self.profiles = method_profiles or DEFAULT_METHOD_PROFILES
        logger.info("BreedingMethodRecommender 초기화 완료")

    def recommend(
        self,
        config: BreedingProgramConfig,
        trait_heritabilities: Dict[str, float],
        trait_types: Dict[str, TraitType],
        parent_plants: List[RicePlant] = None
    ) -> BreedingRecommendation:
        """
        최적 육종 방법 추천

        Args:
            config: 육종 프로그램 설정
            trait_heritabilities: 형질별 유전력 (0-1)
            trait_types: 형질별 유형 (질적/양적)
            parent_plants: 교배 모본 리스트

        Returns:
            BreedingRecommendation: 추천 결과
        """
        logger.info(f"육종 방법 추천 시작 - 목표 형질: {config.target_traits}")

        decision_path = []
        available_methods = list(self.profiles.keys())
        scores: Dict[BreedingMethod, float] = {m: 0.0 for m in available_methods}

        # Step 1: 형질 유형에 따른 초기 필터링
        primary_trait = config.target_traits[0] if config.target_traits else None
        trait_type = trait_types.get(primary_trait, TraitType.QUANTITATIVE)

        if trait_type == TraitType.QUALITATIVE:
            decision_path.append("Node 1: 목표 형질이 질적 형질 (1-3 유전자)")
            scores[BreedingMethod.MABC] += 30
            scores[BreedingMethod.PEDIGREE] += 20
            decision_path.append("→ MABC, Pedigree 방법에 가점")
        else:
            decision_path.append("Node 1: 목표 형질이 양적 형질 (다인자)")
            scores[BreedingMethod.SSD] += 20
            scores[BreedingMethod.BULK] += 15
            decision_path.append("→ SSD, Bulk 방법에 가점")

        # Step 2: 유전력에 따른 점수 조정
        avg_heritability = np.mean(list(trait_heritabilities.values())) if trait_heritabilities else 0.5

        if avg_heritability > 0.6:
            decision_path.append(f"Node 2: 평균 유전력 높음 (h²={avg_heritability:.2f} > 0.6)")
            scores[BreedingMethod.PEDIGREE] += 25
            scores[BreedingMethod.DH] += 15
            decision_path.append("→ Pedigree 방법 최적 (초기 선발 효율 극대화)")
        elif avg_heritability < 0.3:
            decision_path.append(f"Node 2: 평균 유전력 낮음 (h²={avg_heritability:.2f} < 0.3)")
            scores[BreedingMethod.SSD] += 25
            scores[BreedingMethod.BULK] += 20
            decision_path.append("→ SSD/Bulk 방법 권장 (후기 세대 선발)")
        else:
            decision_path.append(f"Node 2: 평균 유전력 중간 (h²={avg_heritability:.2f})")

        # Step 3: 시설 및 예산 조건
        if config.has_speed_breeding:
            decision_path.append("Node 3: Speed Breeding 시설 보유")
            scores[BreedingMethod.SSD] += 20
            decision_path.append("→ SSD 방법 가능 (연간 3-4세대)")

        if config.has_dh_facility:
            decision_path.append("Node 3: DH 시설 보유")
            scores[BreedingMethod.DH] += 20
            decision_path.append("→ DH 방법 가능")

        # Step 4: 비용 제약
        if config.budget_limit > 0:
            for method, profile in self.profiles.items():
                estimated_cost = self._estimate_total_cost(config, profile)
                if estimated_cost > config.budget_limit:
                    decision_path.append(f"Node 4: {profile.name_kr} 비용 초과 ({estimated_cost:,.0f} > {config.budget_limit:,.0f})")
                    scores[method] -= 50  # 예산 초과 페널티
                else:
                    # 비용 효율성 가점
                    efficiency_bonus = 10 * (1 - estimated_cost / config.budget_limit)
                    scores[method] += efficiency_bonus

        # Step 5: 시간 제약
        if config.time_limit_years > 0:
            for method, profile in self.profiles.items():
                if profile.typical_cycle_years > config.time_limit_years:
                    decision_path.append(f"Node 5: {profile.name_kr} 시간 초과")
                    scores[method] -= 30
                else:
                    time_bonus = 10 * (1 - profile.typical_cycle_years / config.time_limit_years)
                    scores[method] += time_bonus

        # Step 6: 배경 유전자형 보존 필요성 (MABC 특수 케이스)
        if parent_plants and len(parent_plants) >= 1:
            recurrent_parent = parent_plants[0]
            if recurrent_parent.selection_status == "elite":
                decision_path.append("Node 6: 엘리트 품종에 특정 유전자만 추가 필요")
                scores[BreedingMethod.MABC] += 25
                decision_path.append("→ MABC 최적 (배경 선발 효율화)")

        # 최종 추천 결정
        sorted_methods = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        recommended = sorted_methods[0][0]
        alternatives = [m for m, s in sorted_methods[1:3] if s > 0]

        # 비용 분석 수행
        cost_analysis = self._perform_cost_analysis(config, trait_heritabilities)

        # 신뢰도 계산
        top_score = sorted_methods[0][1]
        second_score = sorted_methods[1][1] if len(sorted_methods) > 1 else 0
        confidence = min(1.0, (top_score - second_score) / 50 + 0.5) if top_score > 0 else 0.3

        # 추천 이유 생성
        reasoning = self._generate_reasoning(
            recommended, config, avg_heritability, trait_type
        )

        result = BreedingRecommendation(
            recommended_method=recommended,
            alternative_methods=alternatives,
            confidence_score=confidence,
            reasoning=reasoning,
            cost_analysis=cost_analysis,
            decision_path=decision_path
        )

        logger.info(f"추천 완료: {recommended.value} (신뢰도: {confidence:.2f})")
        return result

    def _estimate_total_cost(
        self,
        config: BreedingProgramConfig,
        profile: BreedingMethodProfile
    ) -> float:
        """총 육종 비용 추정"""
        # 기본 비용 = 개체당 비용 × 재배 개체수 × 세대수
        generations = int(profile.typical_cycle_years * profile.generations_per_year)
        plants_per_generation = min(1000, config.field_capacity // generations)

        cultivation_cost = profile.cost_per_plant * plants_per_generation * generations

        # MABC의 경우 마커 분석 비용 추가
        if profile.method == BreedingMethod.MABC:
            genotyping_cost = plants_per_generation * generations * 10000  # 개체당 1만원
            cultivation_cost += genotyping_cost

        return cultivation_cost

    def _perform_cost_analysis(
        self,
        config: BreedingProgramConfig,
        trait_heritabilities: Dict[str, float]
    ) -> Dict[BreedingMethod, BreedingCostAnalysis]:
        """방법별 비용-편익 분석"""
        analyses = {}

        avg_h2 = np.mean(list(trait_heritabilities.values())) if trait_heritabilities else 0.5
        # 상가적 유전 분산 추정 (임의값)
        sigma_a = 0.3  # 표준화된 단위

        for method, profile in self.profiles.items():
            total_cost = self._estimate_total_cost(config, profile)

            # 육종가 방정식: ΔG = (i × r × σA) / L
            # i = 선발 강도 (상위 10% 선발 시 약 1.76)
            selection_intensity = 1.76

            genetic_gain = (
                selection_intensity *
                profile.selection_accuracy *
                np.sqrt(avg_h2) *  # 유전력의 제곱근
                sigma_a /
                profile.typical_cycle_years
            )

            analyses[method] = BreedingCostAnalysis(
                method=method,
                total_cost=total_cost,
                total_years=profile.typical_cycle_years,
                expected_genetic_gain=genetic_gain * profile.typical_cycle_years,
                genetic_gain_per_year=genetic_gain,
                genetic_gain_per_cost=genetic_gain / (total_cost / 1e6) if total_cost > 0 else 0,
                cost_breakdown={
                    "cultivation": total_cost * 0.6,
                    "genotyping": total_cost * 0.3 if method == BreedingMethod.MABC else total_cost * 0.1,
                    "labor": total_cost * 0.1 if method == BreedingMethod.MABC else total_cost * 0.3
                }
            )

        return analyses

    def _generate_reasoning(
        self,
        method: BreedingMethod,
        config: BreedingProgramConfig,
        heritability: float,
        trait_type: TraitType
    ) -> List[str]:
        """추천 이유 생성"""
        profile = self.profiles[method]
        reasons = []

        reasons.append(f"추천 방법: {profile.name_kr}")

        if method == BreedingMethod.PEDIGREE:
            reasons.append(f"• 유전력이 높아(h²={heritability:.2f}) 초기 세대 선발이 효과적입니다.")
            reasons.append("• 계통 기록 관리가 용이하여 체계적인 육종이 가능합니다.")

        elif method == BreedingMethod.SSD:
            if config.has_speed_breeding:
                reasons.append("• Speed Breeding 시설을 활용하여 연간 3-4세대 진전 가능합니다.")
            reasons.append(f"• 유전력이 낮은 형질(h²={heritability:.2f})에 적합한 후기 세대 선발 방식입니다.")
            reasons.append("• 비용 대비 효율성이 높습니다.")

        elif method == BreedingMethod.DH:
            reasons.append("• 육종 연한을 극단적으로 단축할 수 있습니다.")
            reasons.append("• 완전 호모화로 선발 정확도가 높아집니다.")
            if config.has_dh_facility:
                reasons.append("• 조직배양 시설을 보유하고 있어 즉시 적용 가능합니다.")

        elif method == BreedingMethod.MABC:
            if trait_type == TraitType.QUALITATIVE:
                reasons.append("• 소수의 주동 유전자 도입에 최적화된 방법입니다.")
            reasons.append("• 마커 기반 선발로 배경 회복이 빠릅니다.")
            reasons.append("• 결과 예측의 확실성이 높습니다.")

        elif method == BreedingMethod.BULK:
            reasons.append("• 최소 비용으로 유전적 변이를 유지할 수 있습니다.")
            reasons.append("• 자연 선택을 활용하여 환경 적응성을 높입니다.")

        return reasons

    def compare_methods(
        self,
        config: BreedingProgramConfig,
        trait_heritabilities: Dict[str, float]
    ) -> str:
        """
        모든 육종 방법 비교 테이블 생성

        BDSS UI에서 사용할 비교 데이터를 생성합니다.
        """
        cost_analysis = self._perform_cost_analysis(config, trait_heritabilities)

        table = ["=" * 80]
        table.append("육종 방법 비교표")
        table.append("=" * 80)
        table.append(f"{'방법':<15}{'총비용(만원)':<15}{'육종연한(년)':<15}{'연간유전이득':<15}{'비용효율':<15}")
        table.append("-" * 80)

        for method, analysis in cost_analysis.items():
            profile = self.profiles[method]
            table.append(
                f"{profile.name_kr:<15}"
                f"{analysis.total_cost/10000:>12,.0f}"
                f"{analysis.total_years:>12.1f}"
                f"{analysis.genetic_gain_per_year:>14.3f}"
                f"{analysis.genetic_gain_per_cost:>14.3f}"
            )

        table.append("=" * 80)

        return "\n".join(table)


def example_recommendation():
    """추천 시스템 예제"""
    recommender = BreedingMethodRecommender()

    # 육종 프로그램 설정
    config = BreedingProgramConfig(
        program_id="PROG001",
        program_name="고품질 다수성 벼 육종",
        target_traits=["yield", "grain_quality", "blast_resistance"],
        budget_limit=500000000,  # 5억원
        time_limit_years=6,
        has_speed_breeding=True,
        has_dh_facility=False,
        field_capacity=5000
    )

    # 형질 정보
    heritabilities = {
        "yield": 0.35,  # 수량 - 유전력 낮음
        "grain_quality": 0.65,  # 미질 - 유전력 중간
        "blast_resistance": 0.85  # 도열병 저항성 - 유전력 높음
    }

    trait_types = {
        "yield": TraitType.QUANTITATIVE,
        "grain_quality": TraitType.QUANTITATIVE,
        "blast_resistance": TraitType.QUALITATIVE
    }

    # 추천 수행
    result = recommender.recommend(config, heritabilities, trait_types)

    print("=" * 60)
    print("육종 방법 추천 결과")
    print("=" * 60)
    print(f"추천 방법: {result.recommended_method.value}")
    print(f"신뢰도: {result.confidence_score:.2f}")
    print(f"\n대안 방법: {[m.value for m in result.alternative_methods]}")

    print("\n추천 이유:")
    for reason in result.reasoning:
        print(f"  {reason}")

    print("\n의사결정 경로:")
    for step in result.decision_path:
        print(f"  {step}")

    print("\n" + recommender.compare_methods(config, heritabilities))

    return result


if __name__ == "__main__":
    example_recommendation()
