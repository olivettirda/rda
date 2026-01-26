"""
BDSS Elite Parent Identifier - 엘리트 모본 판별 모듈

통계 분석 결과를 종합하여 엘리트 모본을 선발하고
추천 순위를 제공합니다.
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Any
import numpy as np
import logging

from .models import RicePlant, EliteEvaluationResult
from .statistical_engine import StatisticalEngine

logger = logging.getLogger(__name__)


@dataclass
class ElitePanel:
    """엘리트 패널 (선발된 모본 그룹)"""
    core_elite: List[EliteEvaluationResult]    # 핵심 엘리트 (상위 5%)
    elite: List[EliteEvaluationResult]          # 엘리트 (상위 15%)
    candidate: List[EliteEvaluationResult]      # 후보 (상위 30%)
    removed: List[EliteEvaluationResult]        # 제외

    total_evaluated: int = 0
    selection_criteria: str = ""

    def get_all_selected(self) -> List[EliteEvaluationResult]:
        """선발된 모든 엘리트 반환"""
        return self.core_elite + self.elite + self.candidate


class EliteParentIdentifier:
    """
    엘리트 모본 판별기

    BLUP, WAASB, WAASBY, MTSI 분석을 통합하여
    최적의 엘리트 모본을 선발합니다.
    """

    def __init__(
        self,
        stat_engine: StatisticalEngine = None,
        core_elite_ratio: float = 0.05,  # 상위 5%
        elite_ratio: float = 0.15,        # 상위 15%
        candidate_ratio: float = 0.30     # 상위 30%
    ):
        self.stat_engine = stat_engine or StatisticalEngine()
        self.core_elite_ratio = core_elite_ratio
        self.elite_ratio = elite_ratio
        self.candidate_ratio = candidate_ratio

        logger.info("EliteParentIdentifier 초기화 완료")

    def evaluate_panel(
        self,
        plants: List[RicePlant],
        yield_data: Dict[str, Dict[str, float]],  # {genotype: {environment: yield}}
        trait_data: Dict[str, Dict[str, float]] = None,  # {genotype: {trait: value}}
        yield_weight: float = 0.6,
        stability_weight: float = 0.4
    ) -> ElitePanel:
        """
        모본 패널 종합 평가

        Args:
            plants: 평가할 식물 리스트
            yield_data: 환경별 수량 데이터
            trait_data: 다형질 데이터 (선택)
            yield_weight: 수량 가중치
            stability_weight: 안정성 가중치

        Returns:
            ElitePanel: 분류된 엘리트 패널
        """
        logger.info(f"모본 패널 평가 시작 - {len(plants)}개 유전자형")

        # 데이터 행렬 변환
        genotype_names = [p.variety_name or p.plant_id for p in plants]

        # 환경 리스트 추출
        all_envs = set()
        for geno_data in yield_data.values():
            all_envs.update(geno_data.keys())
        env_names = sorted(list(all_envs))

        # 수량 행렬 생성
        yield_matrix = np.zeros((len(genotype_names), len(env_names)))
        for i, name in enumerate(genotype_names):
            for j, env in enumerate(env_names):
                yield_matrix[i, j] = yield_data.get(name, {}).get(env, np.nan)

        # 결측치 처리 (평균 대체)
        col_means = np.nanmean(yield_matrix, axis=0)
        for j in range(yield_matrix.shape[1]):
            yield_matrix[np.isnan(yield_matrix[:, j]), j] = col_means[j]

        # 다형질 행렬 생성 (선택)
        trait_matrix = None
        if trait_data:
            trait_names = set()
            for geno_traits in trait_data.values():
                trait_names.update(geno_traits.keys())
            trait_names = sorted(list(trait_names))

            trait_matrix = np.zeros((len(genotype_names), len(trait_names)))
            for i, name in enumerate(genotype_names):
                for j, trait in enumerate(trait_names):
                    trait_matrix[i, j] = trait_data.get(name, {}).get(trait, np.nan)

            # 결측치 처리
            col_means = np.nanmean(trait_matrix, axis=0)
            for j in range(trait_matrix.shape[1]):
                trait_matrix[np.isnan(trait_matrix[:, j]), j] = col_means[j]

        # 통계 분석 실행
        self.stat_engine.yield_weight = yield_weight
        self.stat_engine.stability_weight = stability_weight

        elite_data = self.stat_engine.identify_elite_parents(
            yield_matrix=yield_matrix,
            trait_matrix=trait_matrix,
            genotype_names=genotype_names,
            selection_method="waasby",
            top_n=len(genotype_names)
        )

        # EliteEvaluationResult 변환
        evaluation_results = []
        for data in elite_data:
            result = EliteEvaluationResult(
                plant_id=data["genotype_id"],
                variety_name=data["genotype_id"],
                breeding_values={"yield": data["mean_yield"]},
                waasb=data["waasb"],
                waasby=data["waasby"],
                mtsi=data.get("mtsi", 0.0) or 0.0,
                overall_rank=data["rank"],
                recommendation=data["recommendation"]
            )
            evaluation_results.append(result)

        # 패널 분류
        n = len(evaluation_results)
        n_core = max(1, int(n * self.core_elite_ratio))
        n_elite = max(2, int(n * self.elite_ratio))
        n_candidate = max(3, int(n * self.candidate_ratio))

        panel = ElitePanel(
            core_elite=evaluation_results[:n_core],
            elite=evaluation_results[n_core:n_elite],
            candidate=evaluation_results[n_elite:n_candidate],
            removed=evaluation_results[n_candidate:],
            total_evaluated=n,
            selection_criteria=f"WAASBY (Y:{yield_weight}, S:{stability_weight})"
        )

        logger.info(
            f"패널 분류 완료 - "
            f"Core Elite: {len(panel.core_elite)}, "
            f"Elite: {len(panel.elite)}, "
            f"Candidate: {len(panel.candidate)}"
        )

        return panel

    def generate_report(self, panel: ElitePanel) -> str:
        """엘리트 패널 보고서 생성"""
        lines = [
            "=" * 70,
            "엘리트 모본 판별 보고서",
            "=" * 70,
            f"\n평가 유전자형 수: {panel.total_evaluated}",
            f"선발 기준: {panel.selection_criteria}",
            "",
            "-" * 70,
            "핵심 엘리트 (Core Elite Panel)",
            "-" * 70,
        ]

        for r in panel.core_elite:
            lines.append(
                f"  {r.overall_rank:>3}위 | {r.variety_name:<15} | "
                f"수량: {r.breeding_values.get('yield', 0):.1f} | "
                f"WAASBY: {r.waasby:.2f} | "
                f"WAASB: {r.waasb:.4f}"
            )

        lines.extend([
            "",
            "-" * 70,
            "엘리트 (Elite)",
            "-" * 70,
        ])

        for r in panel.elite:
            lines.append(
                f"  {r.overall_rank:>3}위 | {r.variety_name:<15} | "
                f"수량: {r.breeding_values.get('yield', 0):.1f} | "
                f"WAASBY: {r.waasby:.2f}"
            )

        lines.extend([
            "",
            "-" * 70,
            "후보 (Candidate)",
            "-" * 70,
        ])

        for r in panel.candidate[:5]:  # 상위 5개만 표시
            lines.append(
                f"  {r.overall_rank:>3}위 | {r.variety_name:<15} | "
                f"수량: {r.breeding_values.get('yield', 0):.1f}"
            )

        if len(panel.candidate) > 5:
            lines.append(f"  ... 외 {len(panel.candidate) - 5}개")

        lines.extend([
            "",
            "=" * 70,
            "추천사항:",
            "  - 핵심 엘리트는 우선적으로 교배 모본으로 활용",
            "  - 엘리트는 특정 형질 개량 목적으로 활용",
            "  - 후보는 추가 평가 후 활용 여부 결정",
            "=" * 70
        ])

        return "\n".join(lines)


def example_elite_identification():
    """엘리트 모본 판별 예제"""
    np.random.seed(42)

    identifier = EliteParentIdentifier()

    # 가상의 식물 데이터 생성
    n_genotypes = 30
    plants = [
        RicePlant(variety_name=f"품종{i+1:02d}")
        for i in range(n_genotypes)
    ]

    # 환경별 수량 데이터 생성
    environments = ["2023_봄", "2023_가을", "2024_봄", "2024_가을", "2025_봄"]

    # 유전 효과 (일부는 높은 수량)
    genetic_effects = np.random.normal(100, 12, n_genotypes)
    genetic_effects[:5] += 20  # 상위 5개는 고수량

    # 환경 효과
    env_effects = {"2023_봄": 5, "2023_가을": -3, "2024_봄": 8, "2024_가을": -2, "2025_봄": 0}

    # GxE 상호작용 (일부는 불안정)
    stability = np.ones(n_genotypes) * 3
    stability[5:10] = 10  # 일부는 불안정
    stability[20:25] = 1  # 일부는 매우 안정적

    yield_data = {}
    for i, plant in enumerate(plants):
        name = plant.variety_name
        yield_data[name] = {}
        for env in environments:
            yield_val = (
                genetic_effects[i] +
                env_effects[env] +
                np.random.normal(0, stability[i])
            )
            yield_data[name][env] = max(0, yield_val)

    # 다형질 데이터
    trait_data = {}
    for i, plant in enumerate(plants):
        name = plant.variety_name
        trait_data[name] = {
            "수량": genetic_effects[i],
            "품질": np.random.normal(80, 10),
            "내병성": np.random.normal(70, 15),
            "초형": np.random.normal(90, 8)
        }

    # 평가 실행
    panel = identifier.evaluate_panel(
        plants=plants,
        yield_data=yield_data,
        trait_data=trait_data,
        yield_weight=0.6,
        stability_weight=0.4
    )

    # 보고서 출력
    report = identifier.generate_report(panel)
    print(report)

    return panel


if __name__ == "__main__":
    example_elite_identification()
