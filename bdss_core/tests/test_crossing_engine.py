"""
BDSS Crossing Engine Tests
교배 엔진 단위 테스트

테스트 대상 엣지 케이스:
1. CMS Dead-end 교배 감지
2. 모계 효과 지연 발현
3. 분리비 왜곡 (S 세포질)
4. Rf 유전자 용량 효과
5. 온도 스트레스에 따른 CMS 불안정성
"""

import pytest
import numpy as np
from typing import List

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from bdss_core.models import (
    RicePlant, Genotype, Phenotype, CMSType, CytoplasmType,
    FertilityStatus, RfGene, MaternalEffectGene
)
from bdss_core.crossing_engine import (
    CrossingEngine, CrossType, SegregationDistortionConfig
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def crossing_engine():
    """기본 교배 엔진 인스턴스"""
    return CrossingEngine()


@pytest.fixture
def cms_a_line():
    """CMS A-line (불임계)"""
    return RicePlant(
        variety_name="IR58025A",
        genotype=Genotype(
            cytoplasm=CytoplasmType.STERILE,
            cms_type=CMSType.WA,
            rf_genotypes={"Rf4": "rr"}
        )
    )


@pytest.fixture
def maintainer_b_line():
    """유지친 B-line"""
    return RicePlant(
        variety_name="IR58025B",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={"Rf4": "rr"}
        )
    )


@pytest.fixture
def restorer_r_line():
    """회복친 R-line (RR 호모)"""
    return RicePlant(
        variety_name="IR34686R",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={"Rf4": "RR"}
        )
    )


@pytest.fixture
def restorer_r_line_heterozygous():
    """회복친 R-line (Rr 헤테로)"""
    return RicePlant(
        variety_name="IR34686R_het",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={"Rf4": "Rr"}
        )
    )


@pytest.fixture
def normal_variety():
    """일반 품종 (Rf 없음)"""
    return RicePlant(
        variety_name="일반벼",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={}
        )
    )


# ============================================================================
# Test Class: CMS Dead-end Detection
# ============================================================================

class TestCMSDeadEnd:
    """CMS 데드엔드 교배 감지 테스트"""

    def test_dead_end_cross_detected(
        self,
        crossing_engine,
        cms_a_line,
        normal_variety
    ):
        """
        테스트: A-line x 일반 품종 = 데드엔드 교배

        CMS A-line을 모본으로 사용하고 회복 유전자가 없는
        일반 품종을 부본으로 사용하면 F1이 불임이 됩니다.
        시스템은 이를 감지하고 경고해야 합니다.
        """
        result = crossing_engine.perform_cross(
            female=cms_a_line,
            male=normal_variety
        )

        # 교배 유형이 dead_end로 분류되어야 함
        assert result.cross_type == CrossType.DEAD_END.value

        # 경고 메시지가 있어야 함
        assert len(result.warnings) > 0
        assert any("데드엔드" in w or "Dead" in w.lower() or "불임" in w for w in result.warnings)

        # 자손 유전자형이 생성되지 않아야 함 (또는 경고만)
        # 실제 구현에 따라 조정

    def test_hybrid_production_not_dead_end(
        self,
        crossing_engine,
        cms_a_line,
        restorer_r_line
    ):
        """
        테스트: A-line x R-line = 정상 F1 하이브리드

        회복 유전자를 가진 R-line을 부본으로 사용하면
        F1은 임성이 회복되어 정상적인 종자를 맺습니다.
        """
        result = crossing_engine.perform_cross(
            female=cms_a_line,
            male=restorer_r_line
        )

        # 데드엔드가 아닌 하이브리드 생산으로 분류
        assert result.cross_type == CrossType.HYBRID_PRODUCTION.value

        # 자손 유전자형이 생성되어야 함
        assert len(result.offspring_genotypes) > 0

        # F1은 S 세포질 + Rr 유전자형
        f1_gt = result.offspring_genotypes[0]
        assert f1_gt.cytoplasm == CytoplasmType.STERILE
        assert f1_gt.rf_genotypes.get("Rf4") == "Rr"

    def test_maintainer_propagation(
        self,
        crossing_engine,
        cms_a_line,
        maintainer_b_line
    ):
        """
        테스트: A-line x B-line = 유지친 증식

        B-line은 A-line과 핵 유전자형이 동일하고
        세포질만 정상이므로, 교배 결과 A-line이 유지됩니다.
        """
        result = crossing_engine.perform_cross(
            female=cms_a_line,
            male=maintainer_b_line
        )

        # 유지친 증식으로 분류
        assert result.cross_type == CrossType.MAINTAINER_PROPAGATION.value

        # F1은 S 세포질 + rr (불임 유지)
        f1_gt = result.offspring_genotypes[0]
        assert f1_gt.cytoplasm == CytoplasmType.STERILE
        assert f1_gt.rf_genotypes.get("Rf4") == "rr"


# ============================================================================
# Test Class: Rf Gene Dosage Effect
# ============================================================================

class TestRfDosageEffect:
    """Rf 유전자 용량 효과 테스트"""

    def test_homozygous_rf_full_restoration(
        self,
        crossing_engine,
        cms_a_line,
        restorer_r_line
    ):
        """
        테스트: RR 호모접합은 완전한 임성 회복

        Rf4/Rf4 (RR) 유전자형은 CMS를 완전히 회복시켜
        화분 임성률이 100%에 가까워야 합니다.
        """
        # F1 생성
        result = crossing_engine.perform_cross(
            female=cms_a_line,
            male=restorer_r_line
        )
        f1_gt = result.offspring_genotypes[0]

        # F1은 Rr이지만, 회복친이 RR이므로 자손의 회복력 확인
        # 실제로 F1 x F1 교배 후 F2에서 RR 개체 확인

        # Rf4 유전자의 용량 효과 테스트
        rf4 = crossing_engine.rf_genes["Rf4"]

        rr_restoration = rf4.get_restoration_level("RR")
        assert rr_restoration == 1.0, "RR은 완전 회복이어야 함"

    def test_heterozygous_rf_partial_restoration(self, crossing_engine):
        """
        테스트: Rr 헤테로접합은 부분적 임성 회복

        용량 효과로 인해 Rr은 RR보다 약간 낮은 회복력을 보입니다.
        """
        rf4 = crossing_engine.rf_genes["Rf4"]

        rr_restoration = rf4.get_restoration_level("RR")
        het_restoration = rf4.get_restoration_level("Rr")
        null_restoration = rf4.get_restoration_level("rr")

        # RR > Rr > rr
        assert rr_restoration > het_restoration
        assert het_restoration > null_restoration
        assert null_restoration == 0.0

        # Rr은 일반적으로 85% 이상 회복
        assert het_restoration >= 0.80

    def test_temperature_stress_reduces_restoration(self, crossing_engine):
        """
        테스트: 온도 스트레스는 임성 회복을 감소시킴

        고온/저온 스트레스는 CMS 회복을 불안정하게 만들어
        화분 임성률이 저하됩니다.
        """
        rf4 = crossing_engine.rf_genes["Rf4"]

        # 정상 조건
        normal_restoration = rf4.get_restoration_level("Rr", temperature_stress=0.0)

        # 스트레스 조건
        stressed_restoration = rf4.get_restoration_level("Rr", temperature_stress=0.5)

        # 스트레스 상황에서 회복력 감소
        assert stressed_restoration < normal_restoration

        # RR은 스트레스에도 더 안정적
        rr_stressed = rf4.get_restoration_level("RR", temperature_stress=0.5)
        assert rr_stressed >= stressed_restoration


# ============================================================================
# Test Class: Maternal Effect
# ============================================================================

class TestMaternalEffect:
    """모계 효과 테스트"""

    def test_maternal_effect_on_seed_trait(self, crossing_engine):
        """
        테스트: 종자 형질은 모체 유전자형의 영향을 받음

        OsPHO1;2 유전자 돌연변이가 있는 모체의 종자는
        종자 자체의 유전자형과 무관하게 품질이 저하됩니다.
        """
        # 모계 효과 유전자 확인
        maternal_gene = crossing_engine.maternal_effect_genes.get("OsPHO1;2")
        assert maternal_gene is not None

        # 정상 모체
        normal_contribution = maternal_gene.calculate_maternal_contribution(
            "WT/WT", "grain_weight"
        )
        assert normal_contribution == 1.0

        # 돌연변이 호모 모체
        mutant_contribution = maternal_gene.calculate_maternal_contribution(
            "mut/mut", "grain_weight"
        )
        assert mutant_contribution == 0.0

        # 이형접합 모체
        het_contribution = maternal_gene.calculate_maternal_contribution(
            "WT/mut", "grain_weight"
        )
        assert 0.0 < het_contribution < 1.0

    def test_pericarp_color_maternal_inheritance(self, crossing_engine):
        """
        테스트: 과피색은 1세대 지연 발현

        과피색(Rc 유전자)은 모체 조직에서 유래하므로
        F1 종자의 색은 F1 유전자형이 아닌 P1 유전자형을 따릅니다.
        """
        # Rc 유전자는 모계 효과 유전자
        rc_gene = crossing_engine.maternal_effect_genes.get("Rc")
        assert rc_gene is not None

        # 지연 발현 세대 확인
        assert rc_gene.phenotype_delay_generations == 1

        # 과피색 형질에 영향
        assert "pericarp_color" in rc_gene.affected_traits


# ============================================================================
# Test Class: Segregation Distortion
# ============================================================================

class TestSegregationDistortion:
    """분리비 왜곡 테스트"""

    def test_f2_segregation_with_distortion(self, crossing_engine):
        """
        테스트: S 세포질에서 Rf 유전자 분리비 왜곡

        CMS 세포질 내에서 Rf 유전자는 정상적인 1:2:1 분리가
        아닌 R allele 쪽으로 치우친 분리를 보입니다.
        """
        # F1 유전자형 (S 세포질, Rr)
        f1_gt = Genotype(
            cytoplasm=CytoplasmType.STERILE,
            cms_type=CMSType.WA,
            rf_genotypes={"Rf4": "Rr"}
        )

        # 왜곡 적용 F2 집단 생성
        np.random.seed(42)  # 재현성을 위한 시드
        f2_population = crossing_engine.generate_f2_population(
            f1_gt,
            population_size=1000,
            apply_distortion=True
        )

        # 유전자형 빈도 계산
        counts = {"RR": 0, "Rr": 0, "rr": 0}
        for gt in f2_population:
            rf_gt = gt.rf_genotypes.get("Rf4", "rr")
            counts[rf_gt] += 1

        # 왜곡 검증: R allele이 더 많아야 함
        # 정상 분리: RR=250, Rr=500, rr=250
        # 왜곡 분리: RR > 250, rr < 250

        distortion_coef = crossing_engine.distortion_config.rf_distortion_coefficient

        # R allele 빈도 = (2*RR + Rr) / 2N
        r_allele_freq = (2 * counts["RR"] + counts["Rr"]) / (2 * 1000)

        # 정상이면 0.5, 왜곡이면 > 0.5
        assert r_allele_freq > 0.5, f"R allele 빈도가 왜곡되어야 함: {r_allele_freq}"

    def test_f2_segregation_without_distortion(self, crossing_engine):
        """
        테스트: 정상 세포질에서는 멘델 분리

        N 세포질에서는 정상적인 1:2:1 분리비를 따릅니다.
        """
        # F1 유전자형 (N 세포질, Rr)
        f1_gt = Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={"Rf4": "Rr"}
        )

        np.random.seed(42)
        f2_population = crossing_engine.generate_f2_population(
            f1_gt,
            population_size=1000,
            apply_distortion=True  # 왜곡 설정은 했지만 N 세포질이므로 적용 안됨
        )

        counts = {"RR": 0, "Rr": 0, "rr": 0}
        for gt in f2_population:
            rf_gt = gt.rf_genotypes.get("Rf4", "rr")
            counts[rf_gt] += 1

        # 정상 분리 검증 (카이제곱 테스트 대신 범위 체크)
        expected = 1000 / 4  # 각 호모 유전자형 기대값 250
        tolerance = 50  # 통계적 변동 허용

        # RR과 rr이 비슷해야 함 (정상 분리)
        assert abs(counts["RR"] - expected) < tolerance
        assert abs(counts["rr"] - expected) < tolerance


# ============================================================================
# Test Class: Fertility Calculation
# ============================================================================

class TestFertilityCalculation:
    """임성 계산 테스트"""

    def test_normal_cytoplasm_always_fertile(self, crossing_engine, normal_variety):
        """정상 세포질은 항상 임성"""
        status, rate = normal_variety.calculate_fertility(crossing_engine.rf_genes)

        assert status == FertilityStatus.FERTILE
        assert rate == 1.0

    def test_cms_without_rf_sterile(self, crossing_engine, cms_a_line):
        """CMS + Rf 없음 = 불임"""
        status, rate = cms_a_line.calculate_fertility(crossing_engine.rf_genes)

        assert status == FertilityStatus.STERILE
        assert rate == 0.0

    def test_cms_with_rf_restored(self, crossing_engine):
        """CMS + Rf 있음 = 회복"""
        # F1 하이브리드 (S 세포질 + Rr)
        f1_hybrid = RicePlant(
            variety_name="F1_Hybrid",
            genotype=Genotype(
                cytoplasm=CytoplasmType.STERILE,
                cms_type=CMSType.WA,
                rf_genotypes={"Rf4": "Rr"}
            )
        )

        status, rate = f1_hybrid.calculate_fertility(crossing_engine.rf_genes)

        # Rr은 부분 회복 또는 완전 회복 (용량 효과에 따라)
        assert status in [FertilityStatus.FERTILE, FertilityStatus.PARTIAL_FERTILE]
        assert rate > 0.5


# ============================================================================
# Test Class: Line Type Determination
# ============================================================================

class TestLineTypeDetermination:
    """계통 유형 자동 결정 테스트"""

    def test_a_line_detection(self, cms_a_line):
        """A-line 자동 감지"""
        assert cms_a_line.line_type == "A-line"

    def test_b_line_detection(self, maintainer_b_line):
        """B-line 자동 감지"""
        assert maintainer_b_line.line_type == "B-line"

    def test_r_line_detection(self, restorer_r_line):
        """R-line 자동 감지"""
        assert restorer_r_line.line_type == "R-line"

    def test_f1_hybrid_detection(self, crossing_engine, cms_a_line, restorer_r_line):
        """F1 hybrid 자동 감지"""
        result = crossing_engine.perform_cross(
            female=cms_a_line,
            male=restorer_r_line
        )

        f1_gt = result.offspring_genotypes[0]

        # F1 식물 생성
        f1_plant = RicePlant(
            variety_name="F1",
            genotype=f1_gt
        )

        assert f1_plant.line_type == "F1-hybrid"


# ============================================================================
# Run Tests
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
