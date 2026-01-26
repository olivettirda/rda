"""
BDSS Statistical Engine - 통계 분석 엔진

Henderson의 혼합 모형(BLUP), WAASB, MTSI 등
고급 통계 분석 기능을 제공합니다.

주요 기능:
1. BLUP (Best Linear Unbiased Prediction) - 육종가 추정
2. WAASB (Weighted Average of Absolute Scores) - 안정성 분석
3. WAASBY - 생산성 + 안정성 결합 지수
4. MTSI (Multi-Trait Stability Index) - 다형질 안정성 지수
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from numpy.linalg import inv, pinv
import logging

logger = logging.getLogger(__name__)


@dataclass
class BLUPResult:
    """BLUP 분석 결과"""
    genotype_id: str
    breeding_value: float           # 육종가 (u-hat)
    gca: float                     # 일반조합능력
    reliability: float             # 신뢰도
    pev: float                     # 예측오차분산 (Prediction Error Variance)
    rank: int = 0


@dataclass
class WAASBResult:
    """WAASB 분석 결과"""
    genotype_id: str
    mean_yield: float              # 평균 수량
    waasb: float                   # WAASB 지수 (낮을수록 안정적)
    waasb_rank: int                # 안정성 순위
    ipca_scores: List[float] = field(default_factory=list)  # IPCA 점수들


@dataclass
class WAASBYResult:
    """WAASBY (생산성 + 안정성 결합) 분석 결과"""
    genotype_id: str
    mean_yield: float
    yield_rank_score: float        # 수량 순위 점수 (0-100)
    waasb: float
    waasb_rank_score: float        # 안정성 순위 점수 (0-100)
    waasby: float                  # 결합 지수
    waasby_rank: int               # 최종 순위


@dataclass
class MTSIResult:
    """MTSI 분석 결과"""
    genotype_id: str
    factor_scores: Dict[str, float]  # 인자별 점수
    mtsi: float                    # MTSI 값 (낮을수록 이상형에 가까움)
    mtsi_rank: int                 # 최종 순위
    selected: bool = False         # 선발 여부


class StatisticalEngine:
    """
    고급 통계 분석 엔진

    벼 육종에서 엘리트 모본 선발을 위한
    BLUP, WAASB, MTSI 분석을 수행합니다.
    """

    def __init__(
        self,
        yield_weight: float = 0.6,  # 수량 가중치 (WAASBY용)
        stability_weight: float = 0.4  # 안정성 가중치 (WAASBY용)
    ):
        """
        Args:
            yield_weight: WAASBY에서 수량의 가중치 (θY)
            stability_weight: WAASBY에서 안정성의 가중치 (θS)
        """
        self.yield_weight = yield_weight
        self.stability_weight = stability_weight
        logger.info(f"StatisticalEngine 초기화 - 가중치 Y:{yield_weight}, S:{stability_weight}")

    def calculate_blup(
        self,
        phenotype_data: np.ndarray,
        design_matrix_fixed: np.ndarray,
        design_matrix_random: np.ndarray,
        pedigree_matrix: np.ndarray = None,
        variance_ratio: float = 1.0
    ) -> List[BLUPResult]:
        """
        BLUP (Best Linear Unbiased Prediction) 계산

        Henderson의 혼합 모형 방정식을 풀어 육종가를 추정합니다.

        모형: y = Xβ + Zu + e
        여기서:
        - y: 표현형 벡터
        - X: 고정 효과 설계 행렬
        - β: 고정 효과 (연차, 지역 등)
        - Z: 임의 효과 설계 행렬
        - u: 임의 효과 (유전자형/GCA)
        - e: 잔차

        MME (Mixed Model Equations):
        [X'X    X'Z  ] [β̂]   [X'y]
        [Z'X  Z'Z+λA⁻¹] [û] = [Z'y]

        Args:
            phenotype_data: 표현형 데이터 벡터 (n x 1)
            design_matrix_fixed: 고정 효과 설계 행렬 X (n x p)
            design_matrix_random: 임의 효과 설계 행렬 Z (n x q)
            pedigree_matrix: 혈통 관계 행렬 A (q x q), None이면 단위행렬
            variance_ratio: λ = σ²e / σ²a

        Returns:
            List[BLUPResult]: 각 유전자형의 BLUP 결과
        """
        logger.info("BLUP 분석 시작")

        y = phenotype_data.flatten()
        X = design_matrix_fixed
        Z = design_matrix_random
        n = len(y)
        q = Z.shape[1]  # 유전자형 수

        # A 행렬 (혈통 관계)
        if pedigree_matrix is None:
            A = np.eye(q)
        else:
            A = pedigree_matrix

        # A의 역행렬 (특이 행렬인 경우 의사역행렬 사용)
        try:
            A_inv = inv(A)
        except np.linalg.LinAlgError:
            A_inv = pinv(A)
            logger.warning("A 행렬이 특이 행렬입니다. 의사역행렬 사용.")

        # λ = σ²e / σ²a
        lambda_val = variance_ratio

        # MME 구성
        # [X'X    X'Z    ] [β̂]   [X'y]
        # [Z'X  Z'Z+λA⁻¹ ] [û] = [Z'y]

        XtX = X.T @ X
        XtZ = X.T @ Z
        ZtX = Z.T @ X
        ZtZ = Z.T @ Z

        # 좌변 행렬
        p = X.shape[1]
        LHS = np.zeros((p + q, p + q))
        LHS[:p, :p] = XtX
        LHS[:p, p:] = XtZ
        LHS[p:, :p] = ZtX
        LHS[p:, p:] = ZtZ + lambda_val * A_inv

        # 우변 벡터
        RHS = np.zeros(p + q)
        RHS[:p] = X.T @ y
        RHS[p:] = Z.T @ y

        # 연립방정식 풀기
        try:
            solutions = np.linalg.solve(LHS, RHS)
        except np.linalg.LinAlgError:
            solutions = pinv(LHS) @ RHS
            logger.warning("MME가 특이합니다. 의사역행렬 사용.")

        # 결과 추출
        beta_hat = solutions[:p]
        u_hat = solutions[p:]

        # 예측 오차 분산 (PEV) 계산
        # PEV = C₂₂ × σ²e (C = LHS의 역행렬)
        try:
            C = inv(LHS)
        except np.linalg.LinAlgError:
            C = pinv(LHS)

        C22 = C[p:, p:]  # 임의 효과 부분의 역행렬

        # 결과 객체 생성
        results = []
        for i in range(q):
            pev = C22[i, i] * variance_ratio  # σ²e로 스케일링

            # 신뢰도 계산: r² = 1 - PEV / σ²a
            # σ²a 추정이 필요하지만, 간단히 분산으로 대체
            reliability = max(0, 1 - pev / (np.var(u_hat) + 0.001))

            results.append(BLUPResult(
                genotype_id=f"G{i+1}",
                breeding_value=u_hat[i],
                gca=u_hat[i],  # BLUP = GCA for balanced data
                reliability=reliability,
                pev=pev
            ))

        # 순위 부여
        results.sort(key=lambda x: x.breeding_value, reverse=True)
        for i, result in enumerate(results):
            result.rank = i + 1

        logger.info(f"BLUP 분석 완료 - {q}개 유전자형")
        return results

    def calculate_waasb(
        self,
        yield_matrix: np.ndarray,
        genotype_names: List[str] = None,
        environment_names: List[str] = None,
        n_ipca: int = None
    ) -> List[WAASBResult]:
        """
        WAASB (Weighted Average of Absolute Scores) 계산

        AMMI 모델의 IPCA 점수를 가중 평균하여 안정성을 평가합니다.

        WAASB_i = Σ(|IPCA_ik × EP_k|) / Σ(EP_k)

        여기서:
        - IPCA_ik: 유전자형 i의 k번째 IPCA 점수
        - EP_k: k번째 주성분이 설명하는 분산 비율

        Args:
            yield_matrix: 수량 데이터 행렬 (유전자형 × 환경)
            genotype_names: 유전자형 이름 리스트
            environment_names: 환경 이름 리스트
            n_ipca: 사용할 IPCA 수 (None이면 유의미한 것만 사용)

        Returns:
            List[WAASBResult]: 각 유전자형의 WAASB 결과
        """
        logger.info("WAASB 분석 시작")

        n_genotypes, n_envs = yield_matrix.shape

        if genotype_names is None:
            genotype_names = [f"G{i+1}" for i in range(n_genotypes)]

        # AMMI 분석 수행
        # 1. 대평균, 유전자형 평균, 환경 평균 계산
        grand_mean = np.mean(yield_matrix)
        genotype_means = np.mean(yield_matrix, axis=1)
        env_means = np.mean(yield_matrix, axis=0)

        # 2. 상호작용 행렬 계산
        # GxE = Y_ij - μ - G_i - E_j
        interaction = yield_matrix.copy()
        for i in range(n_genotypes):
            for j in range(n_envs):
                interaction[i, j] = (
                    yield_matrix[i, j] - grand_mean -
                    (genotype_means[i] - grand_mean) -
                    (env_means[j] - grand_mean)
                )

        # 3. SVD로 IPCA 계산
        U, S, Vt = np.linalg.svd(interaction, full_matrices=False)

        # 유의미한 IPCA 수 결정
        total_ss = np.sum(S**2)
        explained_variance = (S**2) / total_ss

        if n_ipca is None:
            # 누적 분산 90% 이상 설명하는 수
            cumsum = np.cumsum(explained_variance)
            n_ipca = np.argmax(cumsum >= 0.9) + 1
            n_ipca = max(1, min(n_ipca, len(S)))

        logger.info(f"사용할 IPCA 수: {n_ipca}")

        # 4. WAASB 계산
        results = []
        ep_weights = explained_variance[:n_ipca] / np.sum(explained_variance[:n_ipca])

        for i in range(n_genotypes):
            ipca_scores = U[i, :n_ipca] * S[:n_ipca]

            # WAASB = 가중 절대값 평균
            waasb = np.sum(np.abs(ipca_scores) * ep_weights)

            results.append(WAASBResult(
                genotype_id=genotype_names[i],
                mean_yield=genotype_means[i],
                waasb=waasb,
                waasb_rank=0,  # 나중에 설정
                ipca_scores=ipca_scores.tolist()
            ))

        # 순위 부여 (WAASB가 낮을수록 안정적)
        results.sort(key=lambda x: x.waasb)
        for i, result in enumerate(results):
            result.waasb_rank = i + 1

        logger.info(f"WAASB 분석 완료 - {n_genotypes}개 유전자형")
        return results

    def calculate_waasby(
        self,
        waasb_results: List[WAASBResult],
        yield_weight: float = None,
        stability_weight: float = None
    ) -> List[WAASBYResult]:
        """
        WAASBY (생산성 + 안정성 결합 지수) 계산

        WAASBY = (rY × θY + rW × θS) / (θY + θS)

        여기서:
        - rY: 수량의 재조정 순위 점수 (0-100)
        - rW: WAASB의 재조정 순위 점수 (0-100)
        - θY: 수량 가중치
        - θS: 안정성 가중치

        Args:
            waasb_results: WAASB 분석 결과
            yield_weight: 수량 가중치 (기본: 인스턴스 설정값)
            stability_weight: 안정성 가중치 (기본: 인스턴스 설정값)

        Returns:
            List[WAASBYResult]: WAASBY 결과
        """
        if yield_weight is None:
            yield_weight = self.yield_weight
        if stability_weight is None:
            stability_weight = self.stability_weight

        logger.info(f"WAASBY 분석 시작 - 가중치 Y:{yield_weight}, S:{stability_weight}")

        n = len(waasb_results)

        # 수량 순위 점수 계산 (높을수록 좋음)
        sorted_by_yield = sorted(waasb_results, key=lambda x: x.mean_yield, reverse=True)
        yield_rank_scores = {
            r.genotype_id: 100 * (n - i) / n
            for i, r in enumerate(sorted_by_yield)
        }

        # WAASB 순위 점수 계산 (낮을수록 좋음 = 안정적)
        sorted_by_waasb = sorted(waasb_results, key=lambda x: x.waasb)
        waasb_rank_scores = {
            r.genotype_id: 100 * (n - i) / n
            for i, r in enumerate(sorted_by_waasb)
        }

        # WAASBY 계산
        results = []
        for r in waasb_results:
            ry = yield_rank_scores[r.genotype_id]
            rw = waasb_rank_scores[r.genotype_id]

            waasby = (ry * yield_weight + rw * stability_weight) / (yield_weight + stability_weight)

            results.append(WAASBYResult(
                genotype_id=r.genotype_id,
                mean_yield=r.mean_yield,
                yield_rank_score=ry,
                waasb=r.waasb,
                waasb_rank_score=rw,
                waasby=waasby,
                waasby_rank=0
            ))

        # 최종 순위 부여 (WAASBY가 높을수록 좋음)
        results.sort(key=lambda x: x.waasby, reverse=True)
        for i, result in enumerate(results):
            result.waasby_rank = i + 1

        logger.info(f"WAASBY 분석 완료")
        return results

    def calculate_mtsi(
        self,
        trait_matrix: np.ndarray,
        genotype_names: List[str] = None,
        trait_names: List[str] = None,
        ideotype_direction: Dict[str, str] = None,
        selection_intensity: float = 0.15,  # 상위 15% 선발
        n_factors: int = None
    ) -> List[MTSIResult]:
        """
        MTSI (Multi-Trait Stability Index) 계산

        여러 형질을 인자 분석으로 축소한 뒤,
        이상형(Ideotype)과의 거리를 계산합니다.

        MTSI_i = √(Σ(F_ij - F_j*)²)

        여기서:
        - F_ij: 유전자형 i의 인자 j 점수
        - F_j*: 이상형의 인자 j 점수

        Args:
            trait_matrix: 형질 데이터 행렬 (유전자형 × 형질)
            genotype_names: 유전자형 이름 리스트
            trait_names: 형질 이름 리스트
            ideotype_direction: 형질별 선발 방향 {"trait": "max"/"min"}
            selection_intensity: 선발 강도 (0-1)
            n_factors: 인자 수 (None이면 자동 결정)

        Returns:
            List[MTSIResult]: MTSI 결과
        """
        logger.info("MTSI 분석 시작")

        n_genotypes, n_traits = trait_matrix.shape

        if genotype_names is None:
            genotype_names = [f"G{i+1}" for i in range(n_genotypes)]

        if trait_names is None:
            trait_names = [f"T{i+1}" for i in range(n_traits)]

        if ideotype_direction is None:
            # 기본: 모든 형질 최대화
            ideotype_direction = {t: "max" for t in trait_names}

        # 1. 데이터 표준화
        standardized = (trait_matrix - np.mean(trait_matrix, axis=0)) / (np.std(trait_matrix, axis=0) + 1e-8)

        # 2. 인자 분석 (PCA 기반 단순화)
        # 공분산 행렬
        cov_matrix = np.cov(standardized.T)

        # 고유값 분해
        eigenvalues, eigenvectors = np.linalg.eigh(cov_matrix)

        # 내림차순 정렬
        idx = np.argsort(eigenvalues)[::-1]
        eigenvalues = eigenvalues[idx]
        eigenvectors = eigenvectors[:, idx]

        # 인자 수 결정 (Kaiser 기준: 고유값 > 1)
        if n_factors is None:
            n_factors = np.sum(eigenvalues > 1)
            n_factors = max(1, min(n_factors, n_traits))

        logger.info(f"사용할 인자 수: {n_factors}")

        # 3. 인자 점수 계산
        factor_loadings = eigenvectors[:, :n_factors] * np.sqrt(eigenvalues[:n_factors])
        factor_scores = standardized @ factor_loadings

        # 4. 이상형 인자 점수 결정
        ideotype_scores = np.zeros(n_factors)
        for f in range(n_factors):
            # 각 인자에서 가장 높은/낮은 점수
            # 인자 로딩 방향과 형질 방향을 고려
            factor_column = factor_scores[:, f]
            ideotype_scores[f] = np.max(factor_column)  # 단순화: 최대값

        # 5. MTSI 계산
        results = []
        for i in range(n_genotypes):
            genotype_scores = factor_scores[i, :]

            # 이상형과의 거리
            mtsi = np.sqrt(np.sum((genotype_scores - ideotype_scores) ** 2))

            factor_dict = {f"F{j+1}": genotype_scores[j] for j in range(n_factors)}

            results.append(MTSIResult(
                genotype_id=genotype_names[i],
                factor_scores=factor_dict,
                mtsi=mtsi,
                mtsi_rank=0,
                selected=False
            ))

        # 6. 순위 및 선발
        results.sort(key=lambda x: x.mtsi)
        n_selected = max(1, int(n_genotypes * selection_intensity))

        for i, result in enumerate(results):
            result.mtsi_rank = i + 1
            result.selected = i < n_selected

        logger.info(f"MTSI 분석 완료 - {n_selected}개 선발")
        return results

    def identify_elite_parents(
        self,
        yield_matrix: np.ndarray,
        trait_matrix: np.ndarray = None,
        genotype_names: List[str] = None,
        selection_method: str = "waasby",  # "blup", "waasb", "waasby", "mtsi"
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        엘리트 모본 종합 평가 및 선발

        여러 통계 지표를 종합하여 엘리트 모본을 선발합니다.

        Args:
            yield_matrix: 수량 데이터 (유전자형 × 환경)
            trait_matrix: 다형질 데이터 (유전자형 × 형질) - MTSI용
            genotype_names: 유전자형 이름
            selection_method: 선발 기준 ("blup", "waasb", "waasby", "mtsi")
            top_n: 상위 선발 개수

        Returns:
            선발된 엘리트 모본 정보 리스트
        """
        logger.info(f"엘리트 모본 선발 시작 - 기준: {selection_method}")

        n_genotypes = yield_matrix.shape[0]
        if genotype_names is None:
            genotype_names = [f"G{i+1}" for i in range(n_genotypes)]

        # WAASB 분석 (기본)
        waasb_results = self.calculate_waasb(yield_matrix, genotype_names)

        # WAASBY 분석
        waasby_results = self.calculate_waasby(waasb_results)

        # MTSI 분석 (다형질 데이터가 있는 경우)
        mtsi_results = None
        if trait_matrix is not None:
            mtsi_results = self.calculate_mtsi(trait_matrix, genotype_names)

        # 선발 기준에 따른 결과 정렬
        if selection_method == "waasb":
            sorted_results = sorted(waasb_results, key=lambda x: x.waasb)
            key_metric = "waasb"
        elif selection_method == "waasby":
            sorted_results = sorted(waasby_results, key=lambda x: x.waasby, reverse=True)
            key_metric = "waasby"
        elif selection_method == "mtsi" and mtsi_results:
            sorted_results = sorted(mtsi_results, key=lambda x: x.mtsi)
            key_metric = "mtsi"
        else:
            sorted_results = sorted(waasby_results, key=lambda x: x.waasby, reverse=True)
            key_metric = "waasby"

        # 상위 N개 선발
        elite_parents = []
        for i, result in enumerate(sorted_results[:top_n]):
            genotype_id = result.genotype_id

            # WAASB 결과에서 평균 수량 찾기
            waasb_r = next((w for w in waasb_results if w.genotype_id == genotype_id), None)
            waasby_r = next((w for w in waasby_results if w.genotype_id == genotype_id), None)
            mtsi_r = next((m for m in mtsi_results if m.genotype_id == genotype_id), None) if mtsi_results else None

            recommendation = "Core Elite" if i < 3 else ("Elite" if i < 7 else "Candidate")

            elite = {
                "rank": i + 1,
                "genotype_id": genotype_id,
                "mean_yield": waasb_r.mean_yield if waasb_r else 0,
                "waasb": waasb_r.waasb if waasb_r else 0,
                "waasb_rank": waasb_r.waasb_rank if waasb_r else 0,
                "waasby": waasby_r.waasby if waasby_r else 0,
                "waasby_rank": waasby_r.waasby_rank if waasby_r else 0,
                "mtsi": mtsi_r.mtsi if mtsi_r else None,
                "mtsi_rank": mtsi_r.mtsi_rank if mtsi_r else None,
                "recommendation": recommendation,
                "selection_criterion": key_metric
            }

            elite_parents.append(elite)

        logger.info(f"엘리트 모본 선발 완료 - {len(elite_parents)}개")
        return elite_parents


def example_statistical_analysis():
    """통계 분석 예제"""
    np.random.seed(42)

    engine = StatisticalEngine(yield_weight=0.6, stability_weight=0.4)

    # 가상의 수량 데이터 생성 (20 유전자형 × 5 환경)
    n_genotypes, n_envs = 20, 5
    genotype_names = [f"품종{i+1:02d}" for i in range(n_genotypes)]

    # 기본 유전 효과
    genetic_effect = np.random.normal(100, 15, n_genotypes)

    # 환경 효과
    env_effect = np.array([10, -5, 0, 5, -10])

    # GxE 상호작용 (일부 품종은 불안정)
    gxe = np.random.normal(0, 5, (n_genotypes, n_envs))
    # 일부 품종에 높은 불안정성 부여
    gxe[0:3, :] *= 3  # 품종 1-3은 매우 불안정
    gxe[15:18, :] *= 0.3  # 품종 16-18은 매우 안정적

    # 최종 수량 행렬
    yield_matrix = (
        genetic_effect.reshape(-1, 1) +
        env_effect.reshape(1, -1) +
        gxe +
        np.random.normal(0, 2, (n_genotypes, n_envs))  # 오차
    )

    print("=" * 70)
    print("WAASB 분석 결과 (안정성)")
    print("=" * 70)
    waasb_results = engine.calculate_waasb(yield_matrix, genotype_names)
    print(f"{'순위':<6}{'품종':<12}{'평균수량':<12}{'WAASB':<12}")
    print("-" * 42)
    for r in waasb_results[:10]:
        print(f"{r.waasb_rank:<6}{r.genotype_id:<12}{r.mean_yield:<12.1f}{r.waasb:<12.4f}")

    print("\n" + "=" * 70)
    print("WAASBY 분석 결과 (생산성 + 안정성)")
    print("=" * 70)
    waasby_results = engine.calculate_waasby(waasb_results)
    print(f"{'순위':<6}{'품종':<12}{'평균수량':<12}{'WAASBY':<12}")
    print("-" * 42)
    for r in waasby_results[:10]:
        print(f"{r.waasby_rank:<6}{r.genotype_id:<12}{r.mean_yield:<12.1f}{r.waasby:<12.2f}")

    # 다형질 데이터 (MTSI용)
    n_traits = 4
    trait_matrix = np.random.normal(0, 1, (n_genotypes, n_traits))
    trait_matrix[:, 0] = genetic_effect / 10  # 수량과 상관

    print("\n" + "=" * 70)
    print("MTSI 분석 결과 (다형질 안정성)")
    print("=" * 70)
    mtsi_results = engine.calculate_mtsi(
        trait_matrix, genotype_names,
        selection_intensity=0.2
    )
    print(f"{'순위':<6}{'품종':<12}{'MTSI':<12}{'선발':<8}")
    print("-" * 38)
    for r in mtsi_results[:10]:
        print(f"{r.mtsi_rank:<6}{r.genotype_id:<12}{r.mtsi:<12.4f}{'O' if r.selected else ''}")

    print("\n" + "=" * 70)
    print("엘리트 모본 종합 선발")
    print("=" * 70)
    elite_parents = engine.identify_elite_parents(
        yield_matrix, trait_matrix, genotype_names,
        selection_method="waasby",
        top_n=5
    )
    print(f"{'순위':<6}{'품종':<12}{'평균수량':<12}{'WAASBY':<12}{'추천':<12}")
    print("-" * 54)
    for e in elite_parents:
        print(f"{e['rank']:<6}{e['genotype_id']:<12}{e['mean_yield']:<12.1f}"
              f"{e['waasby']:<12.2f}{e['recommendation']:<12}")

    return waasb_results, waasby_results, mtsi_results, elite_parents


if __name__ == "__main__":
    example_statistical_analysis()
