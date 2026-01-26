"""
BDSS Breeding Method Recommender Tests
육종 방법 추천 엔진 테스트
"""

import pytest
import numpy as np

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from bdss_core.models import BreedingMethod, TraitType, BreedingProgramConfig, RicePlant
from bdss_core.breeding_recommender import BreedingMethodRecommender


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def recommender():
    """기본 추천 엔진 인스턴스"""
    return BreedingMethodRecommender()


@pytest.fixture
def high_heritability_config():
    """유전력 높은 형질 대상 육종 프로그램"""
    return BreedingProgramConfig(
        program_id="PROG001",
        program_name="도열병 저항성 육종",
        target_traits=["blast_resistance"],
        budget_limit=100000000,  # 1억
        time_limit_years=8,
        has_speed_breeding=False,
        has_dh_facility=False,
        field_capacity=5000
    )


@pytest.fixture
def low_heritability_config():
    """유전력 낮은 형질 대상 육종 프로그램"""
    return BreedingProgramConfig(
        program_id="PROG002",
        program_name="다수성 육종",
        target_traits=["yield"],
        budget_limit=200000000,
        time_limit_years=6,
        has_speed_breeding=True,
        has_dh_facility=False,
        field_capacity=10000
    )


@pytest.fixture
def urgent_program_config():
    """긴급 품종 개발 프로그램 (시간 제약)"""
    return BreedingProgramConfig(
        program_id="PROG003",
        program_name="긴급 품종 개발",
        target_traits=["salt_tolerance"],
        budget_limit=500000000,
        time_limit_years=3,  # 3년 이내
        has_speed_breeding=True,
        has_dh_facility=True,
        field_capacity=3000
    )


# ============================================================================
# Test Class: Breeding Method Recommendation
# ============================================================================

class TestBreedingRecommendation:
    """육종 방법 추천 테스트"""

    def test_high_heritability_qualitative_recommends_pedigree_or_mabc(
        self,
        recommender,
        high_heritability_config
    ):
        """
        테스트: 유전력 높은 질적 형질 -> Pedigree 또는 MABC 추천

        도열병 저항성과 같은 주동 유전자 형질은
        초기 세대 선발이 효과적이므로 Pedigree나 MABC를 추천합니다.
        """
        heritabilities = {"blast_resistance": 0.85}
        trait_types = {"blast_resistance": TraitType.QUALITATIVE}

        result = recommender.recommend(
            high_heritability_config,
            heritabilities,
            trait_types
        )

        # Pedigree 또는 MABC가 추천되어야 함
        assert result.recommended_method in [BreedingMethod.PEDIGREE, BreedingMethod.MABC]

        # 신뢰도가 합리적인 수준이어야 함
        assert result.confidence_score > 0.3

        # 추천 이유가 있어야 함
        assert len(result.reasoning) > 0

    def test_low_heritability_with_speed_breeding_recommends_ssd(
        self,
        recommender,
        low_heritability_config
    ):
        """
        테스트: 유전력 낮고 Speed Breeding 있으면 -> SSD 추천

        수량성과 같은 다인자 형질은 후기 세대 선발이 효과적이며,
        Speed Breeding 시설이 있으면 SSD가 최적입니다.
        """
        heritabilities = {"yield": 0.25}
        trait_types = {"yield": TraitType.QUANTITATIVE}

        result = recommender.recommend(
            low_heritability_config,
            heritabilities,
            trait_types
        )

        # SSD가 추천되어야 함 (Speed Breeding 있음)
        assert result.recommended_method == BreedingMethod.SSD

        # 의사결정 경로에 Speed Breeding 언급
        assert any("Speed" in path or "SSD" in path for path in result.decision_path)

    def test_urgent_program_recommends_dh(
        self,
        recommender,
        urgent_program_config
    ):
        """
        테스트: 시간 제약이 심하면 -> DH 추천

        3년 내 품종 개발이 필요하고 DH 시설이 있으면
        약배양/반수체 배가(DH)가 가장 빠른 방법입니다.
        """
        heritabilities = {"salt_tolerance": 0.5}
        trait_types = {"salt_tolerance": TraitType.QUALITATIVE}

        result = recommender.recommend(
            urgent_program_config,
            heritabilities,
            trait_types
        )

        # DH가 추천되어야 함 (시간 제약 + DH 시설)
        # 또는 시간 내 완료 가능한 다른 방법
        assert result.recommended_method in [BreedingMethod.DH, BreedingMethod.MABC]

    def test_budget_constraint_filters_expensive_methods(self, recommender):
        """
        테스트: 예산 제약이 심하면 고비용 방법 제외

        예산이 제한적일 때 DH나 MABC 같은 고비용 방법은
        점수가 낮아져야 합니다.
        """
        config = BreedingProgramConfig(
            program_id="PROG004",
            program_name="저예산 육종",
            target_traits=["yield"],
            budget_limit=50000000,  # 5천만 원 (저예산)
            time_limit_years=10,
            has_speed_breeding=False,
            has_dh_facility=True,
            field_capacity=2000
        )

        heritabilities = {"yield": 0.4}
        trait_types = {"yield": TraitType.QUANTITATIVE}

        result = recommender.recommend(config, heritabilities, trait_types)

        # 저비용 방법이 추천되어야 함
        assert result.recommended_method in [
            BreedingMethod.BULK,
            BreedingMethod.SSD,
            BreedingMethod.PEDIGREE
        ]

        # DH는 비용 초과로 낮은 점수
        assert BreedingMethod.DH not in result.alternative_methods[:2]


# ============================================================================
# Test Class: Cost Analysis
# ============================================================================

class TestCostAnalysis:
    """비용 분석 테스트"""

    def test_cost_analysis_generated(self, recommender, high_heritability_config):
        """비용 분석 결과가 생성되는지 확인"""
        heritabilities = {"blast_resistance": 0.85}
        trait_types = {"blast_resistance": TraitType.QUALITATIVE}

        result = recommender.recommend(
            high_heritability_config,
            heritabilities,
            trait_types
        )

        # 각 방법에 대한 비용 분석 존재
        assert len(result.cost_analysis) > 0

        for method, analysis in result.cost_analysis.items():
            assert analysis.total_cost > 0
            assert analysis.total_years > 0
            assert analysis.expected_genetic_gain >= 0

    def test_genetic_gain_per_cost_calculated(self, recommender, low_heritability_config):
        """비용당 유전적 이득이 계산되는지 확인"""
        heritabilities = {"yield": 0.3}
        trait_types = {"yield": TraitType.QUANTITATIVE}

        result = recommender.recommend(
            low_heritability_config,
            heritabilities,
            trait_types
        )

        for method, analysis in result.cost_analysis.items():
            # 비용당 유전 이득은 양수여야 함
            if analysis.total_cost > 0:
                assert analysis.genetic_gain_per_cost >= 0


# ============================================================================
# Test Class: Decision Path
# ============================================================================

class TestDecisionPath:
    """의사결정 경로 테스트"""

    def test_decision_path_recorded(self, recommender, high_heritability_config):
        """의사결정 경로가 기록되는지 확인"""
        heritabilities = {"blast_resistance": 0.85}
        trait_types = {"blast_resistance": TraitType.QUALITATIVE}

        result = recommender.recommend(
            high_heritability_config,
            heritabilities,
            trait_types
        )

        # 의사결정 경로가 기록되어야 함
        assert len(result.decision_path) > 0

        # 첫 번째 노드는 형질 유형 분류
        assert any("Node 1" in path for path in result.decision_path)

    def test_comparison_table_generated(self, recommender, high_heritability_config):
        """비교 테이블이 생성되는지 확인"""
        heritabilities = {"blast_resistance": 0.85}

        table = recommender.compare_methods(high_heritability_config, heritabilities)

        # 테이블 문자열이 생성되어야 함
        assert len(table) > 0
        assert "육종 방법 비교" in table


# ============================================================================
# Test Class: Edge Cases
# ============================================================================

class TestEdgeCases:
    """엣지 케이스 테스트"""

    def test_empty_heritabilities(self, recommender, high_heritability_config):
        """유전력 데이터가 없어도 동작하는지 확인"""
        heritabilities = {}
        trait_types = {}

        # 예외 없이 결과 반환
        result = recommender.recommend(
            high_heritability_config,
            heritabilities,
            trait_types
        )

        assert result.recommended_method is not None

    def test_multiple_traits(self, recommender):
        """다형질 육종 프로그램 처리"""
        config = BreedingProgramConfig(
            program_id="PROG005",
            program_name="다형질 육종",
            target_traits=["yield", "quality", "resistance"],
            budget_limit=200000000,
            time_limit_years=7,
            field_capacity=5000
        )

        heritabilities = {
            "yield": 0.3,
            "quality": 0.6,
            "resistance": 0.8
        }

        trait_types = {
            "yield": TraitType.QUANTITATIVE,
            "quality": TraitType.QUANTITATIVE,
            "resistance": TraitType.QUALITATIVE
        }

        result = recommender.recommend(config, heritabilities, trait_types)

        # 정상적으로 결과 반환
        assert result.recommended_method is not None
        assert len(result.reasoning) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
