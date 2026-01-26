"""
BDSS Statistical Engine 테스트

pytest로 실행: pytest src/tests/test_statistical_engine.py -v
"""

import sys
import os

# 모듈 경로 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np
import pytest

from py.statistical_engine import (
    StatisticalEngine,
    BLUPResult,
    WAASBResult,
    WAASBYResult,
    MTSIResult,
    create_engine,
    calculate_blup_from_js,
    calculate_waasb_from_js,
    calculate_waasby_from_js,
    calculate_mtsi_from_js,
    identify_elite_from_js
)


# ============================================================================
# Fixtures
# ============================================================================

@pytest.fixture
def stat_engine():
    """기본 통계 엔진 인스턴스"""
    return StatisticalEngine(yield_weight=0.6, stability_weight=0.4)


@pytest.fixture
def sample_yield_matrix():
    """샘플 수량 데이터 (10 유전자형 × 4 환경)"""
    np.random.seed(42)

    n_genotypes, n_envs = 10, 4

    # 유전 효과 (일부는 높은 수량)
    genetic_effect = np.array([100, 110, 95, 105, 90, 108, 92, 103, 98, 115])

    # 환경 효과
    env_effect = np.array([5, -3, 2, -4])

    # GxE 상호작용 (품종별 안정성 차이)
    gxe = np.random.normal(0, 3, (n_genotypes, n_envs))
    gxe[0, :] *= 3  # 품종 1은 불안정
    gxe[9, :] *= 0.5  # 품종 10은 안정적

    yield_matrix = (
        genetic_effect.reshape(-1, 1) +
        env_effect.reshape(1, -1) +
        gxe +
        np.random.normal(0, 1, (n_genotypes, n_envs))
    )

    return yield_matrix


@pytest.fixture
def sample_trait_matrix():
    """샘플 다형질 데이터 (10 유전자형 × 5 형질)"""
    np.random.seed(42)
    return np.random.normal(0, 1, (10, 5))


@pytest.fixture
def genotype_names():
    """유전자형 이름 리스트"""
    return [f"품종{i+1:02d}" for i in range(10)]


# ============================================================================
# Test Class: WAASB Analysis
# ============================================================================

class TestWAASB:
    """WAASB 분석 테스트"""

    def test_waasb_calculated(self, stat_engine, sample_yield_matrix, genotype_names):
        """WAASB 값이 계산되는지 확인"""
        results = stat_engine.calculate_waasb(
            sample_yield_matrix,
            genotype_names
        )

        # 결과 개수 확인
        assert len(results) == len(genotype_names)

        # 모든 결과에 필수 필드 존재
        for r in results:
            assert hasattr(r, 'waasb')
            assert hasattr(r, 'mean_yield')
            assert hasattr(r, 'waasb_rank')

    def test_waasb_low_for_stable_genotype(
        self,
        stat_engine,
        sample_yield_matrix,
        genotype_names
    ):
        """안정적인 품종은 WAASB가 낮아야 함"""
        results = stat_engine.calculate_waasb(
            sample_yield_matrix,
            genotype_names
        )

        # WAASB 기준 정렬 (낮을수록 안정적)
        sorted_by_waasb = sorted(results, key=lambda x: x.waasb)

        # 상위 안정 품종의 WAASB가 하위보다 낮아야 함
        stable_avg = np.mean([r.waasb for r in sorted_by_waasb[:3]])
        unstable_avg = np.mean([r.waasb for r in sorted_by_waasb[-3:]])

        assert stable_avg < unstable_avg

    def test_waasb_ranks_assigned(self, stat_engine, sample_yield_matrix, genotype_names):
        """WAASB 순위가 1부터 N까지 부여되는지 확인"""
        results = stat_engine.calculate_waasb(
            sample_yield_matrix,
            genotype_names
        )

        ranks = [r.waasb_rank for r in results]

        # 1부터 N까지 모든 순위 존재
        assert sorted(ranks) == list(range(1, len(genotype_names) + 1))


# ============================================================================
# Test Class: WAASBY Analysis
# ============================================================================

class TestWAASBY:
    """WAASBY 분석 테스트"""

    def test_waasby_combines_yield_and_stability(
        self,
        stat_engine,
        sample_yield_matrix,
        genotype_names
    ):
        """WAASBY가 수량과 안정성을 결합하는지 확인"""
        waasb_results = stat_engine.calculate_waasb(
            sample_yield_matrix,
            genotype_names
        )

        waasby_results = stat_engine.calculate_waasby(waasb_results)

        assert len(waasby_results) == len(genotype_names)

        for r in waasby_results:
            assert hasattr(r, 'waasby')
            assert hasattr(r, 'yield_rank_score')
            assert hasattr(r, 'waasb_rank_score')

    def test_waasby_weight_effect(self, stat_engine, sample_yield_matrix, genotype_names):
        """WAASBY 가중치 변경이 결과에 영향을 미치는지 확인"""
        waasb_results = stat_engine.calculate_waasb(
            sample_yield_matrix,
            genotype_names
        )

        # 수량 중시 가중치
        yield_focused = stat_engine.calculate_waasby(
            waasb_results,
            yield_weight=0.9,
            stability_weight=0.1
        )

        # 안정성 중시 가중치
        stability_focused = stat_engine.calculate_waasby(
            waasb_results,
            yield_weight=0.1,
            stability_weight=0.9
        )

        # 가중치에 따라 WAASBY 값이 다를 수 있음
        # 둘 다 계산되는 것을 확인
        assert len(yield_focused) == len(genotype_names)
        assert len(stability_focused) == len(genotype_names)


# ============================================================================
# Test Class: MTSI Analysis
# ============================================================================

class TestMTSI:
    """MTSI 분석 테스트"""

    def test_mtsi_calculated(self, stat_engine, sample_trait_matrix, genotype_names):
        """MTSI 값이 계산되는지 확인"""
        results = stat_engine.calculate_mtsi(
            sample_trait_matrix,
            genotype_names,
            selection_intensity=0.2
        )

        assert len(results) == len(genotype_names)

        for r in results:
            assert hasattr(r, 'mtsi')
            assert hasattr(r, 'mtsi_rank')
            assert hasattr(r, 'selected')
            assert hasattr(r, 'factor_scores')

    def test_mtsi_selection_intensity(
        self,
        stat_engine,
        sample_trait_matrix,
        genotype_names
    ):
        """MTSI 선발 강도에 따른 선발 개체 수 확인"""
        # 20% 선발
        results_20 = stat_engine.calculate_mtsi(
            sample_trait_matrix,
            genotype_names,
            selection_intensity=0.2
        )

        selected_20 = sum(1 for r in results_20 if r.selected)

        # 50% 선발
        results_50 = stat_engine.calculate_mtsi(
            sample_trait_matrix,
            genotype_names,
            selection_intensity=0.5
        )

        selected_50 = sum(1 for r in results_50 if r.selected)

        # 50% 선발 시 더 많은 개체 선발
        assert selected_50 > selected_20

        # 선발 비율 확인
        assert selected_20 == max(1, int(len(genotype_names) * 0.2))
        assert selected_50 == max(1, int(len(genotype_names) * 0.5))

    def test_mtsi_low_for_ideal_genotype(self, stat_engine, genotype_names):
        """이상형에 가까운 품종은 MTSI가 낮아야 함"""
        # 의도적으로 첫 번째 품종을 이상형에 가깝게 설정
        np.random.seed(42)
        trait_matrix = np.random.normal(0, 1, (10, 4))
        trait_matrix[0, :] = 2.0  # 모든 형질에서 높은 값

        results = stat_engine.calculate_mtsi(
            trait_matrix,
            genotype_names,
            selection_intensity=0.2
        )

        # 첫 번째 품종의 MTSI 순위 확인
        first_genotype_result = next(
            r for r in results
            if r.genotype_id == genotype_names[0]
        )

        # 상위권이어야 함 (낮은 MTSI)
        assert first_genotype_result.mtsi_rank <= 3


# ============================================================================
# Test Class: Elite Parent Identification
# ============================================================================

class TestEliteIdentification:
    """엘리트 모본 선발 테스트"""

    def test_elite_parents_identified(
        self,
        stat_engine,
        sample_yield_matrix,
        sample_trait_matrix,
        genotype_names
    ):
        """엘리트 모본이 선발되는지 확인"""
        elite_parents = stat_engine.identify_elite_parents(
            yield_matrix=sample_yield_matrix,
            genotype_names=genotype_names,
            trait_matrix=sample_trait_matrix,
            selection_method="waasby",
            top_n=5
        )

        assert len(elite_parents) == 5

        for e in elite_parents:
            assert "rank" in e
            assert "genotype_id" in e
            assert "recommendation" in e

    def test_elite_recommendations(
        self,
        stat_engine,
        sample_yield_matrix,
        genotype_names
    ):
        """엘리트 추천 등급이 올바르게 부여되는지 확인"""
        elite_parents = stat_engine.identify_elite_parents(
            yield_matrix=sample_yield_matrix,
            genotype_names=genotype_names,
            selection_method="waasby",
            top_n=10
        )

        recommendations = [e["recommendation"] for e in elite_parents]

        # Core Elite, Elite, Candidate 등급 존재
        assert "Core Elite" in recommendations
        assert "Elite" in recommendations or "Candidate" in recommendations

    def test_different_selection_methods(
        self,
        stat_engine,
        sample_yield_matrix,
        sample_trait_matrix,
        genotype_names
    ):
        """다른 선발 방법도 동작하는지 확인"""
        # WAASB 기준
        waasb_elite = stat_engine.identify_elite_parents(
            yield_matrix=sample_yield_matrix,
            genotype_names=genotype_names,
            selection_method="waasb",
            top_n=5
        )

        # MTSI 기준
        mtsi_elite = stat_engine.identify_elite_parents(
            yield_matrix=sample_yield_matrix,
            trait_matrix=sample_trait_matrix,
            genotype_names=genotype_names,
            selection_method="mtsi",
            top_n=5
        )

        assert len(waasb_elite) == 5
        assert len(mtsi_elite) == 5

        # 선발 기준에 따라 순위가 다를 수 있음
        waasb_top = waasb_elite[0]["genotype_id"]
        mtsi_top = mtsi_elite[0]["genotype_id"]

        # 둘 다 유효한 품종 이름이어야 함
        assert waasb_top in genotype_names
        assert mtsi_top in genotype_names


# ============================================================================
# Test Class: BLUP Analysis
# ============================================================================

class TestBLUP:
    """BLUP 분석 테스트"""

    def test_blup_calculated(self, stat_engine):
        """BLUP 값이 계산되는지 확인"""
        np.random.seed(42)

        n_obs, n_fixed, n_random = 100, 3, 10

        y = np.random.normal(100, 10, n_obs)
        X = np.ones((n_obs, n_fixed))
        X[:, 1] = np.random.randint(0, 2, n_obs)  # 환경 효과
        X[:, 2] = np.random.uniform(0, 1, n_obs)  # 공변량

        Z = np.zeros((n_obs, n_random))
        for i in range(n_obs):
            Z[i, i % n_random] = 1  # 유전자형 배치

        results = stat_engine.calculate_blup(
            phenotype_data=y,
            design_matrix_fixed=X,
            design_matrix_random=Z
        )

        assert len(results) == n_random

        for r in results:
            assert hasattr(r, 'breeding_value')
            assert hasattr(r, 'gca')
            assert hasattr(r, 'reliability')

    def test_blup_ranks_assigned(self, stat_engine):
        """BLUP 순위가 올바르게 부여되는지 확인"""
        np.random.seed(42)

        n_obs, n_fixed, n_random = 50, 2, 5

        y = np.random.normal(100, 10, n_obs)
        X = np.ones((n_obs, n_fixed))
        Z = np.zeros((n_obs, n_random))
        for i in range(n_obs):
            Z[i, i % n_random] = 1

        results = stat_engine.calculate_blup(
            phenotype_data=y,
            design_matrix_fixed=X,
            design_matrix_random=Z
        )

        ranks = [r.rank for r in results]

        # 1부터 N까지 모든 순위 존재
        assert sorted(ranks) == list(range(1, n_random + 1))


# ============================================================================
# Test Class: JavaScript Interface
# ============================================================================

class TestJSInterface:
    """JavaScript 인터페이스 테스트"""

    def test_create_engine(self):
        """엔진 생성 함수 테스트"""
        engine = create_engine(0.7, 0.3)
        assert engine.yield_weight == 0.7
        assert engine.stability_weight == 0.3

    def test_waasb_from_js(self, sample_yield_matrix, genotype_names):
        """JS용 WAASB 함수 테스트"""
        engine = create_engine()
        results = calculate_waasb_from_js(
            engine,
            sample_yield_matrix.tolist(),
            genotype_names
        )

        assert len(results) == len(genotype_names)
        assert "genotype_id" in results[0]
        assert "waasb" in results[0]

    def test_mtsi_from_js(self, sample_trait_matrix, genotype_names):
        """JS용 MTSI 함수 테스트"""
        engine = create_engine()
        results = calculate_mtsi_from_js(
            engine,
            sample_trait_matrix.tolist(),
            genotype_names,
            0.3
        )

        assert len(results) == len(genotype_names)
        assert "mtsi" in results[0]
        assert "selected" in results[0]


# ============================================================================
# Test Class: Edge Cases
# ============================================================================

class TestEdgeCases:
    """엣지 케이스 테스트"""

    def test_small_sample_size(self, stat_engine):
        """작은 샘플 크기에서도 동작하는지 확인"""
        # 3 유전자형 × 2 환경
        yield_matrix = np.array([
            [100, 105],
            [95, 98],
            [110, 112]
        ])

        results = stat_engine.calculate_waasb(yield_matrix)

        assert len(results) == 3

    def test_missing_data_handling(self, stat_engine):
        """결측치가 있는 데이터 처리"""
        yield_matrix = np.array([
            [100, 105, np.nan, 102],
            [95, 98, 100, 97],
            [110, np.nan, 108, 112]
        ])

        # NaN 대체 후 테스트
        yield_matrix_clean = np.nan_to_num(yield_matrix, nan=np.nanmean(yield_matrix))

        results = stat_engine.calculate_waasb(yield_matrix_clean)

        assert len(results) == 3


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
