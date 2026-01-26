"""
BDSS Crossing Engine - 교배 엔진

벼 교배 시뮬레이션의 핵심 로직을 구현합니다.

주요 기능:
1. CMS-Rf 상호작용 기반 임성 예측
2. 모계 효과 시뮬레이션
3. F1/F2 유전자형 분리비 계산 (왜곡 포함)
4. Dead-end 교배 경고
5. 잡종강세(Heterosis) 예측

Critical Gap Analysis에서 식별된 리스크 대응:
- 분리비 왜곡 계수 적용 (S 세포질 내 Rf 편향)
- 환경 스트레스에 따른 CMS 불안정성 모델링
- 모계 효과 지연 발현 추적
"""

from __future__ import annotations
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass, field
import numpy as np
from enum import Enum
import logging

from .models import (
    RicePlant, Genotype, Phenotype, CMSType, CytoplasmType,
    FertilityStatus, CrossingResult, RfGene, MaternalEffectGene,
    SNPMarker
)

# 로깅 설정
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class CrossType(Enum):
    """교배 유형 분류"""
    HYBRID_PRODUCTION = "hybrid_production"      # F1 하이브리드 생산
    MAINTAINER_PROPAGATION = "maintainer_propagation"  # A-line 증식
    BACKCROSS = "backcross"                      # 여교배
    NORMAL_CROSS = "normal_cross"                # 일반 교배
    DEAD_END = "dead_end"                        # 데드엔드 (불임 F1)


@dataclass
class SegregationDistortionConfig:
    """분리비 왜곡 설정

    S 세포질 내에서 Rf 유전자의 분리가 멘델 비율에서
    벗어나는 현상을 모델링합니다.
    """
    # S 세포질에서 R allele 쪽으로의 왜곡 계수 (0-1)
    # 0 = 왜곡 없음, 0.5 = 매우 강한 왜곡
    rf_distortion_coefficient: float = 0.15

    # 왜곡이 적용되는 최소 세대 (F2부터 왜곡 시작)
    min_generation_for_distortion: int = 2


class CrossingEngine:
    """
    벼 교배 시뮬레이션 엔진

    CMS 시스템, 모계 효과, 분리비 왜곡을 모두 고려한
    정밀 교배 시뮬레이션을 수행합니다.
    """

    def __init__(
        self,
        rf_genes: Dict[str, RfGene] = None,
        maternal_effect_genes: Dict[str, MaternalEffectGene] = None,
        distortion_config: SegregationDistortionConfig = None
    ):
        """
        Args:
            rf_genes: 임성 회복 유전자 데이터베이스
            maternal_effect_genes: 모계 효과 유전자 데이터베이스
            distortion_config: 분리비 왜곡 설정
        """
        self.rf_genes = rf_genes or self._get_default_rf_genes()
        self.maternal_effect_genes = maternal_effect_genes or self._get_default_maternal_genes()
        self.distortion_config = distortion_config or SegregationDistortionConfig()

        logger.info(f"CrossingEngine 초기화 완료 - Rf 유전자: {len(self.rf_genes)}개")

    def _get_default_rf_genes(self) -> Dict[str, RfGene]:
        """기본 Rf 유전자 데이터베이스 로드"""
        return {
            "Rf4": RfGene(
                gene_name="Rf4",
                chromosome=10,
                position_cm=65.2,
                cms_types=[CMSType.WA],
                homozygous_restoration=1.0,
                heterozygous_restoration=0.85,
                temperature_sensitivity=0.1  # 약간의 온도 민감성
            ),
            "Rf1a": RfGene(
                gene_name="Rf1a",
                chromosome=10,
                position_cm=62.8,
                cms_types=[CMSType.BT, CMSType.HL],
                homozygous_restoration=1.0,
                heterozygous_restoration=0.9,
                temperature_sensitivity=0.05
            ),
            "Rf1b": RfGene(
                gene_name="Rf1b",
                chromosome=10,
                position_cm=63.5,
                cms_types=[CMSType.BT],
                homozygous_restoration=1.0,
                heterozygous_restoration=0.95,
                temperature_sensitivity=0.02
            ),
        }

    def _get_default_maternal_genes(self) -> Dict[str, MaternalEffectGene]:
        """기본 모계 효과 유전자 데이터베이스"""
        return {
            "OsPHO1;2": MaternalEffectGene(
                gene_name="OsPHO1;2",
                affected_traits=["grain_weight", "chalkiness", "grain_filling"],
                effect_magnitude=0.9,
                phenotype_delay_generations=1
            ),
            "OsROS1": MaternalEffectGene(
                gene_name="OsROS1",
                affected_traits=["seed_dormancy", "germination_rate"],
                effect_magnitude=0.7,
                phenotype_delay_generations=1
            ),
            "Rc": MaternalEffectGene(
                gene_name="Rc",
                affected_traits=["pericarp_color"],
                effect_magnitude=1.0,
                phenotype_delay_generations=1  # 과피색은 모체 조직
            ),
        }

    def perform_cross(
        self,
        female: RicePlant,
        male: RicePlant,
        num_offspring: int = 1,
        temperature_stress: float = 0.0,
        validate: bool = True
    ) -> CrossingResult:
        """
        교배 수행

        Args:
            female: 모본 (암술 제공)
            male: 부본 (화분 제공)
            num_offspring: 생성할 자손 수
            temperature_stress: 환경 스트레스 수준 (0-1)
            validate: 교배 유효성 검사 수행 여부

        Returns:
            CrossingResult: 교배 결과 (자손 유전자형, 경고, 추천사항)
        """
        logger.info(f"교배 수행: {female.variety_name} x {male.variety_name}")

        result = CrossingResult(
            female_parent=female,
            male_parent=male
        )

        # Step 1: 교배 유효성 검사
        if validate:
            self._validate_cross(female, male, result, temperature_stress)

        # 데드엔드 교배인 경우 조기 반환
        if result.cross_type == CrossType.DEAD_END.value:
            logger.warning(f"데드엔드 교배 감지: {result.warnings}")
            return result

        # Step 2: 세포질 유전 결정 (항상 모계)
        offspring_cytoplasm = female.genotype.cytoplasm
        offspring_cms_type = female.genotype.cms_type

        # Step 3: 핵 유전자형 조합 생성
        for i in range(num_offspring):
            offspring_gt = self._generate_f1_genotype(
                female.genotype,
                male.genotype,
                offspring_cytoplasm,
                offspring_cms_type
            )
            result.offspring_genotypes.append(offspring_gt)

        # Step 4: 예상 표현형 계산 (모계 효과 반영)
        result.expected_phenotypes = self._predict_offspring_phenotypes(
            female, male, result.offspring_genotypes
        )

        # Step 5: 교배 유형 분류
        result.cross_type = self._classify_cross_type(female, male, result)

        # Step 6: 추천사항 생성
        self._generate_recommendations(result)

        logger.info(f"교배 완료 - 유형: {result.cross_type}, 자손: {len(result.offspring_genotypes)}개")
        return result

    def _validate_cross(
        self,
        female: RicePlant,
        male: RicePlant,
        result: CrossingResult,
        temperature_stress: float
    ):
        """교배 유효성 검사"""

        # 1. 부본의 임성 확인
        male_fertility, pollen_rate = male.calculate_fertility(
            self.rf_genes, temperature_stress
        )

        if male_fertility == FertilityStatus.STERILE:
            result.warnings.append(
                f"[심각] 부본 '{male.variety_name}'이 불임입니다. 교배 불가."
            )
            result.cross_type = CrossType.DEAD_END.value
            return

        if male_fertility == FertilityStatus.PARTIAL_FERTILE:
            result.warnings.append(
                f"[주의] 부본 '{male.variety_name}'의 화분 임성이 부분적입니다 "
                f"(임성률: {pollen_rate:.1%}). 교배 효율 저하 가능."
            )

        # 2. CMS Dead-end 체크
        if self._is_cms_dead_end(female, male):
            result.warnings.append(
                f"[경고] CMS 데드엔드 교배! "
                f"모본 '{female.variety_name}'은 CMS A-line이지만 "
                f"부본 '{male.variety_name}'에 회복 유전자(Rf)가 없습니다. "
                f"F1 세대가 불임이 되어 자가 채종(F2 생산)이 불가능합니다."
            )
            result.cross_type = CrossType.DEAD_END.value
            return

        # 3. 온도 스트레스 경고
        if temperature_stress > 0.3:
            result.warnings.append(
                f"[주의] 높은 온도 스트레스 ({temperature_stress:.1%})로 인해 "
                f"임성 회복이 불완전할 수 있습니다."
            )

    def _is_cms_dead_end(self, female: RicePlant, male: RicePlant) -> bool:
        """CMS 데드엔드 교배 여부 확인"""
        female_gt = female.genotype
        male_gt = male.genotype

        # 모본이 S 세포질을 가지고 있는 경우
        if female_gt.cytoplasm != CytoplasmType.STERILE:
            return False

        # 부본에 해당 CMS를 회복할 수 있는 Rf 유전자가 있는지 확인
        for rf_name, rf_gene in self.rf_genes.items():
            if female_gt.cms_type not in rf_gene.cms_types:
                continue

            male_rf_gt = male_gt.rf_genotypes.get(rf_name, "rr")
            if male_rf_gt in ["RR", "Rr"]:
                return False  # 회복 유전자 있음 - 데드엔드 아님

        # Rf 유전자가 없으면 데드엔드
        return True

    def _generate_f1_genotype(
        self,
        female_gt: Genotype,
        male_gt: Genotype,
        cytoplasm: CytoplasmType,
        cms_type: CMSType
    ) -> Genotype:
        """F1 유전자형 생성 (멘델 유전)"""
        offspring_gt = Genotype(
            cytoplasm=cytoplasm,  # 항상 모계 유전
            cms_type=cms_type
        )

        # 핵 유전자형 결합
        all_genes = set(female_gt.nuclear_genotype.keys()) | set(male_gt.nuclear_genotype.keys())

        for gene in all_genes:
            female_allele = self._get_one_allele(female_gt.nuclear_genotype.get(gene, "AA"))
            male_allele = self._get_one_allele(male_gt.nuclear_genotype.get(gene, "AA"))
            offspring_gt.nuclear_genotype[gene] = female_allele + male_allele

        # Rf 유전자형 결합
        all_rf_genes = set(female_gt.rf_genotypes.keys()) | set(male_gt.rf_genotypes.keys())

        for rf_gene in all_rf_genes:
            female_rf = female_gt.rf_genotypes.get(rf_gene, "rr")
            male_rf = male_gt.rf_genotypes.get(rf_gene, "rr")

            female_allele = self._get_rf_allele(female_rf)
            male_allele = self._get_rf_allele(male_rf)

            # 정렬하여 일관된 표기 (Rr, 아닌 rR)
            alleles = sorted([female_allele, male_allele], reverse=True)
            offspring_gt.rf_genotypes[rf_gene] = "".join(alleles)

        # SNP 마커 유전자형 결합
        all_markers = set(female_gt.snp_genotypes.keys()) | set(male_gt.snp_genotypes.keys())

        for marker in all_markers:
            female_snp = female_gt.snp_genotypes.get(marker, "-")
            male_snp = male_gt.snp_genotypes.get(marker, "-")

            if female_snp == "-" or male_snp == "-":
                offspring_gt.snp_genotypes[marker] = "-"  # 결측
            elif female_snp == male_snp:
                offspring_gt.snp_genotypes[marker] = female_snp  # 호모
            else:
                offspring_gt.snp_genotypes[marker] = "H"  # 헤테로

        return offspring_gt

    def _get_one_allele(self, genotype: str) -> str:
        """유전자형에서 랜덤하게 하나의 allele 선택 (감수분열 시뮬레이션)"""
        if genotype in ["A", "B"]:
            return genotype
        if genotype == "H" or len(genotype) == 2:
            return np.random.choice(["A", "B"]) if genotype == "H" else np.random.choice(list(genotype))
        return "A"  # 기본값

    def _get_rf_allele(self, rf_genotype: str) -> str:
        """Rf 유전자형에서 하나의 allele 선택"""
        if rf_genotype == "RR":
            return "R"
        elif rf_genotype == "rr":
            return "r"
        elif rf_genotype == "Rr":
            return np.random.choice(["R", "r"])
        return "r"

    def _predict_offspring_phenotypes(
        self,
        female: RicePlant,
        male: RicePlant,
        offspring_genotypes: List[Genotype]
    ) -> Dict[str, List[float]]:
        """
        자손의 예상 표현형 예측 (모계 효과 반영)

        종자 형질의 경우 모체의 유전자형에 따라
        표현형이 결정되는 모계 효과를 고려합니다.
        """
        predicted_phenotypes: Dict[str, List[float]] = {}

        # 모든 형질 수집
        all_traits = set(female.phenotype.traits.keys()) | set(male.phenotype.traits.keys())

        for trait in all_traits:
            trait_values = []

            for offspring_gt in offspring_genotypes:
                # 기본값: 양친 평균 (중간친 유전)
                female_val = female.phenotype.traits.get(trait, 0)
                male_val = male.phenotype.traits.get(trait, 0)
                base_value = (female_val + male_val) / 2

                # 모계 효과 적용
                maternal_contribution = self._calculate_maternal_contribution(
                    female, trait
                )
                # 모계 효과가 있는 형질은 모체 쪽으로 치우침
                adjusted_value = base_value * (0.5 + 0.5 * maternal_contribution)

                trait_values.append(adjusted_value)

            predicted_phenotypes[trait] = trait_values

        return predicted_phenotypes

    def _calculate_maternal_contribution(
        self,
        female: RicePlant,
        trait: str
    ) -> float:
        """특정 형질에 대한 모계 기여도 계산"""
        total_contribution = 1.0

        for gene_name, maternal_gene in self.maternal_effect_genes.items():
            if trait in maternal_gene.affected_traits:
                # 모체의 해당 유전자형 확인
                maternal_gt = female.genotype.nuclear_genotype.get(gene_name, "WT/WT")
                contribution = maternal_gene.calculate_maternal_contribution(
                    maternal_gt, trait
                )
                total_contribution *= contribution

        return total_contribution

    def _classify_cross_type(
        self,
        female: RicePlant,
        male: RicePlant,
        result: CrossingResult
    ) -> str:
        """교배 유형 분류"""
        female_gt = female.genotype
        male_gt = male.genotype

        # A-line x B-line = 유지친 증식
        if (female.line_type == "A-line" and male.line_type == "B-line"):
            return CrossType.MAINTAINER_PROPAGATION.value

        # A-line x R-line = F1 하이브리드 생산
        if (female.line_type == "A-line" and male.line_type == "R-line"):
            return CrossType.HYBRID_PRODUCTION.value

        # BC 세대 확인
        female_gen = female.generation.upper()
        male_gen = male.generation.upper()
        if "BC" in female_gen or "BC" in male_gen:
            return CrossType.BACKCROSS.value

        return CrossType.NORMAL_CROSS.value

    def _generate_recommendations(self, result: CrossingResult):
        """교배 결과에 대한 추천사항 생성"""
        cross_type = result.cross_type

        if cross_type == CrossType.HYBRID_PRODUCTION.value:
            result.recommendations.append(
                "상업용 F1 생산을 위한 적절한 조합입니다. "
                "잡종강세 예측 모듈을 실행하여 예상 수량을 확인하세요."
            )

        elif cross_type == CrossType.MAINTAINER_PROPAGATION.value:
            result.recommendations.append(
                "A-line 종자 증식을 위한 조합입니다. "
                "생산된 종자는 모두 웅성 불임이 됩니다."
            )

        elif cross_type == CrossType.DEAD_END.value:
            result.recommendations.append(
                "이 교배를 피하거나, 부본을 Rf 유전자를 가진 R-line으로 교체하세요."
            )

    def generate_f2_population(
        self,
        f1_genotype: Genotype,
        population_size: int = 100,
        apply_distortion: bool = True
    ) -> List[Genotype]:
        """
        F2 집단 생성 (분리비 왜곡 적용)

        S 세포질 내에서 Rf 유전자의 분리비 왜곡을 모델링합니다.
        정상적인 1:2:1 분리가 (1+d):2:(1-d)로 왜곡됩니다.

        Args:
            f1_genotype: F1의 유전자형
            population_size: 생성할 F2 개체 수
            apply_distortion: 분리비 왜곡 적용 여부

        Returns:
            F2 유전자형 리스트
        """
        f2_population = []

        # 왜곡 계수 계산
        d = self.distortion_config.rf_distortion_coefficient if apply_distortion else 0.0

        for _ in range(population_size):
            f2_gt = Genotype(
                cytoplasm=f1_genotype.cytoplasm,
                cms_type=f1_genotype.cms_type
            )

            # Rf 유전자 분리 (왜곡 적용)
            for rf_name, f1_rf_gt in f1_genotype.rf_genotypes.items():
                if f1_rf_gt == "Rr":
                    # S 세포질에서 Rf 쪽으로 왜곡
                    if f1_genotype.cytoplasm == CytoplasmType.STERILE and apply_distortion:
                        # 왜곡된 분리비: RR=(1+d)/4, Rr=2/4, rr=(1-d)/4
                        probs = [
                            (1 + d) / 4,  # RR
                            0.5,           # Rr
                            (1 - d) / 4   # rr
                        ]
                        probs = np.array(probs) / sum(probs)  # 정규화
                        f2_rf_gt = np.random.choice(["RR", "Rr", "rr"], p=probs)
                    else:
                        # 정상 멘델 분리 1:2:1
                        f2_rf_gt = np.random.choice(
                            ["RR", "Rr", "rr"],
                            p=[0.25, 0.5, 0.25]
                        )
                else:
                    # 호모접합은 그대로 유지
                    f2_rf_gt = f1_rf_gt

                f2_gt.rf_genotypes[rf_name] = f2_rf_gt

            # 일반 핵 유전자 분리 (정상 멘델 분리)
            for gene, f1_gt in f1_genotype.nuclear_genotype.items():
                if f1_gt == "Aa" or f1_gt == "H":
                    f2_gt.nuclear_genotype[gene] = np.random.choice(
                        ["AA", "Aa", "aa"],
                        p=[0.25, 0.5, 0.25]
                    )
                else:
                    f2_gt.nuclear_genotype[gene] = f1_gt

            # SNP 마커 분리
            for marker, f1_snp in f1_genotype.snp_genotypes.items():
                if f1_snp == "H":
                    f2_gt.snp_genotypes[marker] = np.random.choice(
                        ["A", "H", "B"],
                        p=[0.25, 0.5, 0.25]
                    )
                else:
                    f2_gt.snp_genotypes[marker] = f1_snp

            f2_population.append(f2_gt)

        return f2_population

    def predict_seed_phenotype_with_maternal_delay(
        self,
        plant: RicePlant,
        maternal_parent: RicePlant,
        trait: str
    ) -> Tuple[float, str]:
        """
        모계 효과 지연을 고려한 종자 표현형 예측

        종자의 과피색, 배유 특성 등은 종자 자체의 유전자형이 아닌
        모체(이전 세대)의 유전자형에 의해 결정됩니다.

        Args:
            plant: 현재 세대 식물체
            maternal_parent: 모체 (이전 세대)
            trait: 예측할 형질

        Returns:
            (예측값, 설명)
        """
        # 해당 형질에 모계 효과 유전자가 관여하는지 확인
        for gene_name, maternal_gene in self.maternal_effect_genes.items():
            if trait in maternal_gene.affected_traits:
                # 모체의 유전자형으로 표현형 결정
                maternal_gt_str = maternal_parent.genotype.nuclear_genotype.get(gene_name, "WT/WT")

                if maternal_gt_str in ["mut/mut", "aa"]:
                    return 0.0, f"형질 '{trait}'은 모체 유전자형 결손으로 인해 불량합니다."
                elif maternal_gt_str in ["WT/mut", "Aa"]:
                    val = maternal_gene.effect_magnitude * 0.7
                    return val, f"형질 '{trait}'은 모체가 이형접합이므로 부분적으로 영향받습니다."
                else:
                    return 1.0, f"형질 '{trait}'은 모체 유전자형이 정상이므로 양호합니다."

        # 모계 효과 없는 일반 형질
        return plant.phenotype.traits.get(trait, 0.5), "일반 유전 형질 (모계 효과 없음)"


def simulate_crossing_scenario():
    """교배 시나리오 시뮬레이션 예제"""
    engine = CrossingEngine()

    # A-line (CMS 불임계)
    a_line = RicePlant(
        variety_name="IR58025A",
        genotype=Genotype(
            cytoplasm=CytoplasmType.STERILE,
            cms_type=CMSType.WA,
            rf_genotypes={"Rf4": "rr"}
        )
    )

    # R-line (회복친)
    r_line = RicePlant(
        variety_name="IR34686R",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={"Rf4": "RR"}
        )
    )

    # B-line (유지친)
    b_line = RicePlant(
        variety_name="IR58025B",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={"Rf4": "rr"}
        )
    )

    # 일반 품종 (Rf 없음)
    normal_variety = RicePlant(
        variety_name="일반벼",
        genotype=Genotype(
            cytoplasm=CytoplasmType.NORMAL,
            cms_type=CMSType.NONE,
            rf_genotypes={}
        )
    )

    print("=" * 60)
    print("시나리오 A: A-line x R-line (F1 하이브리드 생산)")
    print("=" * 60)
    result_a = engine.perform_cross(a_line, r_line)
    print(f"교배 유형: {result_a.cross_type}")
    print(f"경고: {result_a.warnings}")
    print(f"추천: {result_a.recommendations}")

    print("\n" + "=" * 60)
    print("시나리오 B: A-line x B-line (유지친 증식)")
    print("=" * 60)
    result_b = engine.perform_cross(a_line, b_line)
    print(f"교배 유형: {result_b.cross_type}")
    print(f"경고: {result_b.warnings}")

    print("\n" + "=" * 60)
    print("시나리오 C: A-line x 일반 품종 (데드엔드!)")
    print("=" * 60)
    result_c = engine.perform_cross(a_line, normal_variety)
    print(f"교배 유형: {result_c.cross_type}")
    print(f"경고: {result_c.warnings}")

    return result_a, result_b, result_c


if __name__ == "__main__":
    simulate_crossing_scenario()
