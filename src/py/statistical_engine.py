"""
BDSS Statistical Engine - 통계 분석 엔진 (Pyodide용)

BLUP, WAASB, WAASBY, MTSI 분석을 위한 Python 모듈
브라우저에서 Pyodide를 통해 실행됩니다.
"""

import numpy as np
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
import json


# ============================================================================
# Data Classes
# ============================================================================

@dataclass
class BLUPResult:
    """BLUP 분석 결과"""
    genotype_id: str
    breeding_value: float
    gca: float  # General Combining Ability
    reliability: float
    rank: int = 0


@dataclass
class WAASBResult:
    """WAASB 분석 결과"""
    genotype_id: str
    waasb: float
    mean_yield: float
    waasb_rank: int = 0
    yield_rank: int = 0


@dataclass
class WAASBYResult:
    """WAASBY 분석 결과"""
    genotype_id: str
    waasby: float
    yield_rank_score: float
    waasb_rank_score: float
    waasby_rank: int = 0


@dataclass
class MTSIResult:
    """MTSI 분석 결과"""
    genotype_id: str
    mtsi: float
    mtsi_rank: int = 0
    selected: bool = False
    factor_scores: List[float] = field(default_factory=list)


# ============================================================================
# Statistical Engine Class
# ============================================================================

class StatisticalEngine:
    """
    BDSS 통계 분석 엔진

    주요 기능:
    1. BLUP (Best Linear Unbiased Prediction) - 육종가 추정
    2. WAASB (Weighted Average of Absolute Scores) - 안정성 분석
    3. WAASBY (WAASB + Yield) - 안정성-수량 결합 지수
    4. MTSI (Multi-Trait Stability Index) - 다형질 안정성 지수
    """

    def __init__(self, yield_weight: float = 0.6, stability_weight: float = 0.4):
        """
        초기화

        Args:
            yield_weight: 수량 가중치 (기본: 0.6)
            stability_weight: 안정성 가중치 (기본: 0.4)
        """
        self.yield_weight = yield_weight
        self.stability_weight = stability_weight
        print(f"[StatisticalEngine] 초기화: 수량 가중치={yield_weight}, 안정성 가중치={stability_weight}")

    # ========================================================================
    # BLUP Analysis
    # ========================================================================

    def calculate_blup(
        self,
        phenotype_data: np.ndarray,
        design_matrix_fixed: np.ndarray,
        design_matrix_random: np.ndarray,
        pedigree_matrix: Optional[np.ndarray] = None,
        variance_ratio: float = 1.0,
        genotype_names: Optional[List[str]] = None
    ) -> List[BLUPResult]:
        """
        BLUP 계산 (Henderson's Mixed Model Equations)

        MME: [X'X    X'Z  ][β̂]   [X'y]
             [Z'X  Z'Z+λA⁻¹][û] = [Z'y]

        Args:
            phenotype_data: 표현형 벡터 (y)
            design_matrix_fixed: 고정효과 디자인 행렬 (X)
            design_matrix_random: 랜덤효과 디자인 행렬 (Z)
            pedigree_matrix: 혈통 행렬 (A), None이면 단위행렬
            variance_ratio: λ = σ²e / σ²a
            genotype_names: 유전자형 이름 목록

        Returns:
            BLUP 결과 목록
        """
        print("[StatisticalEngine] BLUP 계산 시작")

        y = np.array(phenotype_data).flatten()
        X = np.array(design_matrix_fixed)
        Z = np.array(design_matrix_random)

        n_random = Z.shape[1]

        # 혈통 행렬 (없으면 단위행렬)
        if pedigree_matrix is None:
            A_inv = np.eye(n_random)
        else:
            A = np.array(pedigree_matrix)
            try:
                A_inv = np.linalg.inv(A)
            except np.linalg.LinAlgError:
                print("[StatisticalEngine] 경고: 혈통 행렬 역행렬 계산 실패, 단위행렬 사용")
                A_inv = np.eye(n_random)

        # MME 구성
        XtX = X.T @ X
        XtZ = X.T @ Z
        ZtX = Z.T @ X
        ZtZ = Z.T @ Z

        Xty = X.T @ y
        Zty = Z.T @ y

        # 좌변 행렬
        n_fixed = X.shape[1]
        lhs = np.zeros((n_fixed + n_random, n_fixed + n_random))
        lhs[:n_fixed, :n_fixed] = XtX
        lhs[:n_fixed, n_fixed:] = XtZ
        lhs[n_fixed:, :n_fixed] = ZtX
        lhs[n_fixed:, n_fixed:] = ZtZ + variance_ratio * A_inv

        # 우변 벡터
        rhs = np.concatenate([Xty, Zty])

        # 해 계산
        try:
            solution = np.linalg.solve(lhs, rhs)
        except np.linalg.LinAlgError:
            print("[StatisticalEngine] 경고: MME 해 계산 실패, 최소제곱 사용")
            solution = np.linalg.lstsq(lhs, rhs, rcond=None)[0]

        # 고정효과와 랜덤효과 분리
        beta_hat = solution[:n_fixed]
        u_hat = solution[n_fixed:]

        # 신뢰도 계산 (단순화)
        # r² = 1 - PEV / σ²a
        # 여기서는 근사치 사용
        reliabilities = np.ones(n_random) * 0.7  # 기본값

        # 결과 생성
        results = []
        for i in range(n_random):
            gid = genotype_names[i] if genotype_names and i < len(genotype_names) else f"G{i+1}"

            results.append(BLUPResult(
                genotype_id=gid,
                breeding_value=float(u_hat[i]),
                gca=float(u_hat[i] / 2),  # GCA = BV / 2
                reliability=float(reliabilities[i])
            ))

        # 순위 부여 (육종가 내림차순)
        results.sort(key=lambda x: x.breeding_value, reverse=True)
        for i, r in enumerate(results):
            r.rank = i + 1

        print(f"[StatisticalEngine] BLUP 계산 완료: {len(results)}개 유전자형")

        return results

    # ========================================================================
    # WAASB Analysis
    # ========================================================================

    def calculate_waasb(
        self,
        yield_matrix: np.ndarray,
        genotype_names: Optional[List[str]] = None,
        n_components: int = 2
    ) -> List[WAASBResult]:
        """
        WAASB (Weighted Average of Absolute Scores) 계산

        AMMI 모델 기반 안정성 분석
        WAASB = Σ(|PC_k| × EP_k) / Σ(EP_k)

        Args:
            yield_matrix: 수량 행렬 (유전자형 × 환경)
            genotype_names: 유전자형 이름 목록
            n_components: 사용할 주성분 수 (기본: 2)

        Returns:
            WAASB 결과 목록
        """
        print("[StatisticalEngine] WAASB 계산 시작")

        Y = np.array(yield_matrix)
        n_genotypes, n_envs = Y.shape

        # 전체 평균
        grand_mean = np.mean(Y)

        # 유전자형 평균, 환경 평균
        genotype_means = np.mean(Y, axis=1)
        env_means = np.mean(Y, axis=0)

        # GxE 상호작용 행렬
        GE = Y - genotype_means.reshape(-1, 1) - env_means.reshape(1, -1) + grand_mean

        # SVD 분해
        try:
            U, S, Vt = np.linalg.svd(GE, full_matrices=False)
        except np.linalg.LinAlgError:
            print("[StatisticalEngine] 경고: SVD 실패, 대체 방법 사용")
            U = np.zeros((n_genotypes, min(n_genotypes, n_envs)))
            S = np.zeros(min(n_genotypes, n_envs))

        # 성분별 설명 비율
        total_ss = np.sum(S ** 2)
        if total_ss > 0:
            explained_proportion = (S ** 2) / total_ss
        else:
            explained_proportion = np.zeros(len(S))

        # WAASB 계산
        n_comp = min(n_components, len(S))
        waasb_values = np.zeros(n_genotypes)

        for g in range(n_genotypes):
            weighted_sum = 0
            weight_sum = 0

            for k in range(n_comp):
                if k < len(explained_proportion):
                    weight = explained_proportion[k]
                    score = abs(U[g, k] * S[k]) if k < len(S) else 0
                    weighted_sum += score * weight
                    weight_sum += weight

            if weight_sum > 0:
                waasb_values[g] = weighted_sum / weight_sum
            else:
                waasb_values[g] = 0

        # 결과 생성
        results = []
        for i in range(n_genotypes):
            gid = genotype_names[i] if genotype_names and i < len(genotype_names) else f"G{i+1}"

            results.append(WAASBResult(
                genotype_id=gid,
                waasb=float(waasb_values[i]),
                mean_yield=float(genotype_means[i])
            ))

        # WAASB 순위 (낮을수록 안정적)
        results.sort(key=lambda x: x.waasb)
        for i, r in enumerate(results):
            r.waasb_rank = i + 1

        # 수량 순위 (높을수록 좋음)
        results.sort(key=lambda x: x.mean_yield, reverse=True)
        for i, r in enumerate(results):
            r.yield_rank = i + 1

        print(f"[StatisticalEngine] WAASB 계산 완료: {len(results)}개 유전자형")

        return results

    # ========================================================================
    # WAASBY Analysis
    # ========================================================================

    def calculate_waasby(
        self,
        waasb_results: List[WAASBResult],
        yield_weight: Optional[float] = None,
        stability_weight: Optional[float] = None
    ) -> List[WAASBYResult]:
        """
        WAASBY (WAASB + Yield) 계산

        수량과 안정성을 결합한 선발 지수
        WAASBY = (rY × wY + rWAASB × wS) / (wY + wS)

        Args:
            waasb_results: WAASB 결과 목록
            yield_weight: 수량 가중치 (None이면 기본값 사용)
            stability_weight: 안정성 가중치 (None이면 기본값 사용)

        Returns:
            WAASBY 결과 목록
        """
        print("[StatisticalEngine] WAASBY 계산 시작")

        wY = yield_weight if yield_weight is not None else self.yield_weight
        wS = stability_weight if stability_weight is not None else self.stability_weight

        n = len(waasb_results)

        # 순위 점수 계산 (1-100 스케일로 변환)
        results = []
        for r in waasb_results:
            # 수량 순위 점수 (높은 순위 = 높은 점수)
            yield_rank_score = 100 * (n - r.yield_rank + 1) / n

            # WAASB 순위 점수 (낮은 WAASB = 높은 안정성 = 높은 점수)
            waasb_rank_score = 100 * (n - r.waasb_rank + 1) / n

            # WAASBY 계산
            waasby = (yield_rank_score * wY + waasb_rank_score * wS) / (wY + wS)

            results.append(WAASBYResult(
                genotype_id=r.genotype_id,
                waasby=float(waasby),
                yield_rank_score=float(yield_rank_score),
                waasb_rank_score=float(waasb_rank_score)
            ))

        # WAASBY 순위 (높을수록 좋음)
        results.sort(key=lambda x: x.waasby, reverse=True)
        for i, r in enumerate(results):
            r.waasby_rank = i + 1

        print(f"[StatisticalEngine] WAASBY 계산 완료: {len(results)}개 유전자형")

        return results

    # ========================================================================
    # MTSI Analysis
    # ========================================================================

    def calculate_mtsi(
        self,
        trait_matrix: np.ndarray,
        genotype_names: Optional[List[str]] = None,
        selection_intensity: float = 0.2,
        trait_weights: Optional[List[float]] = None
    ) -> List[MTSIResult]:
        """
        MTSI (Multi-Trait Stability Index) 계산

        다형질 안정성 지수
        MTSI = √(Σ(F_k - F_k*)² / n_factors)

        Args:
            trait_matrix: 형질 행렬 (유전자형 × 형질)
            genotype_names: 유전자형 이름 목록
            selection_intensity: 선발 강도 (0-1, 기본: 0.2 = 20%)
            trait_weights: 형질별 가중치 (None이면 동일 가중치)

        Returns:
            MTSI 결과 목록
        """
        print("[StatisticalEngine] MTSI 계산 시작")

        X = np.array(trait_matrix)
        n_genotypes, n_traits = X.shape

        # 표준화
        X_std = (X - np.mean(X, axis=0)) / (np.std(X, axis=0) + 1e-10)

        # 형질 가중치 적용
        if trait_weights is not None:
            weights = np.array(trait_weights)
            weights = weights / np.sum(weights)  # 정규화
            X_std = X_std * weights

        # 인자 분석 (PCA 대용)
        try:
            U, S, Vt = np.linalg.svd(X_std, full_matrices=False)
            n_factors = min(3, len(S))  # 최대 3개 인자
            factor_scores = U[:, :n_factors] * S[:n_factors]
        except np.linalg.LinAlgError:
            print("[StatisticalEngine] 경고: SVD 실패, 원본 데이터 사용")
            factor_scores = X_std[:, :min(3, n_traits)]
            n_factors = factor_scores.shape[1]

        # 이상형 (최대값)
        ideotype = np.max(factor_scores, axis=0)

        # MTSI 계산
        mtsi_values = np.sqrt(np.sum((factor_scores - ideotype) ** 2, axis=1) / n_factors)

        # 결과 생성
        results = []
        for i in range(n_genotypes):
            gid = genotype_names[i] if genotype_names and i < len(genotype_names) else f"G{i+1}"

            results.append(MTSIResult(
                genotype_id=gid,
                mtsi=float(mtsi_values[i]),
                factor_scores=factor_scores[i].tolist() if i < len(factor_scores) else []
            ))

        # MTSI 순위 (낮을수록 이상형에 가까움)
        results.sort(key=lambda x: x.mtsi)
        for i, r in enumerate(results):
            r.mtsi_rank = i + 1

        # 선발 개체 표시
        n_selected = max(1, int(n_genotypes * selection_intensity))
        for i in range(n_selected):
            results[i].selected = True

        print(f"[StatisticalEngine] MTSI 계산 완료: {len(results)}개 유전자형, {n_selected}개 선발")

        return results

    # ========================================================================
    # Elite Parent Identification
    # ========================================================================

    def identify_elite_parents(
        self,
        yield_matrix: np.ndarray,
        genotype_names: Optional[List[str]] = None,
        trait_matrix: Optional[np.ndarray] = None,
        selection_method: str = "waasby",
        top_n: int = 10
    ) -> List[Dict]:
        """
        엘리트 모본 선발

        Args:
            yield_matrix: 수량 행렬
            genotype_names: 유전자형 이름 목록
            trait_matrix: 형질 행렬 (MTSI용)
            selection_method: 선발 방법 ("waasb", "waasby", "mtsi")
            top_n: 상위 선발 개수

        Returns:
            엘리트 모본 목록
        """
        print(f"[StatisticalEngine] 엘리트 모본 선발: 방법={selection_method}, top_n={top_n}")

        if selection_method == "waasb":
            waasb_results = self.calculate_waasb(yield_matrix, genotype_names)
            # 낮은 WAASB = 높은 안정성
            waasb_results.sort(key=lambda x: x.waasb)

            elite = []
            for i, r in enumerate(waasb_results[:top_n]):
                recommendation = self._get_recommendation_level(i + 1, top_n)
                elite.append({
                    "rank": i + 1,
                    "genotype_id": r.genotype_id,
                    "waasb": r.waasb,
                    "mean_yield": r.mean_yield,
                    "recommendation": recommendation
                })

        elif selection_method == "waasby":
            waasb_results = self.calculate_waasb(yield_matrix, genotype_names)
            waasby_results = self.calculate_waasby(waasb_results)
            # 높은 WAASBY = 수량+안정성 우수
            waasby_results.sort(key=lambda x: x.waasby, reverse=True)

            elite = []
            for i, r in enumerate(waasby_results[:top_n]):
                recommendation = self._get_recommendation_level(i + 1, top_n)
                elite.append({
                    "rank": i + 1,
                    "genotype_id": r.genotype_id,
                    "waasby": r.waasby,
                    "yield_rank_score": r.yield_rank_score,
                    "stability_rank_score": r.waasb_rank_score,
                    "recommendation": recommendation
                })

        elif selection_method == "mtsi":
            if trait_matrix is None:
                trait_matrix = yield_matrix  # 수량 데이터를 형질로 사용

            mtsi_results = self.calculate_mtsi(trait_matrix, genotype_names)
            # 낮은 MTSI = 이상형에 가까움
            mtsi_results.sort(key=lambda x: x.mtsi)

            elite = []
            for i, r in enumerate(mtsi_results[:top_n]):
                recommendation = self._get_recommendation_level(i + 1, top_n)
                elite.append({
                    "rank": i + 1,
                    "genotype_id": r.genotype_id,
                    "mtsi": r.mtsi,
                    "factor_scores": r.factor_scores,
                    "recommendation": recommendation
                })
        else:
            raise ValueError(f"알 수 없는 선발 방법: {selection_method}")

        print(f"[StatisticalEngine] 엘리트 모본 {len(elite)}개 선발 완료")

        return elite

    def _get_recommendation_level(self, rank: int, total: int) -> str:
        """추천 등급 결정"""
        ratio = rank / total

        if ratio <= 0.1:
            return "Core Elite"
        elif ratio <= 0.3:
            return "Elite"
        elif ratio <= 0.6:
            return "Candidate"
        else:
            return "Reserve"


# ============================================================================
# JavaScript Interface Functions (Pyodide Bridge)
# ============================================================================

def create_engine(yield_weight=0.6, stability_weight=0.4):
    """JavaScript에서 엔진 생성"""
    return StatisticalEngine(yield_weight, stability_weight)


def calculate_blup_from_js(engine, y, X, Z, genotype_names=None):
    """JavaScript에서 BLUP 호출"""
    results = engine.calculate_blup(
        np.array(y),
        np.array(X),
        np.array(Z),
        genotype_names=genotype_names
    )
    return [{"genotype_id": r.genotype_id, "breeding_value": r.breeding_value,
             "gca": r.gca, "reliability": r.reliability, "rank": r.rank}
            for r in results]


def calculate_waasb_from_js(engine, yield_matrix, genotype_names=None):
    """JavaScript에서 WAASB 호출"""
    results = engine.calculate_waasb(np.array(yield_matrix), genotype_names)
    return [{"genotype_id": r.genotype_id, "waasb": r.waasb,
             "mean_yield": r.mean_yield, "waasb_rank": r.waasb_rank,
             "yield_rank": r.yield_rank}
            for r in results]


def calculate_waasby_from_js(engine, waasb_results, yield_weight=None, stability_weight=None):
    """JavaScript에서 WAASBY 호출"""
    # waasb_results를 WAASBResult 객체로 변환
    waasb_objs = [
        WAASBResult(
            genotype_id=r["genotype_id"],
            waasb=r["waasb"],
            mean_yield=r["mean_yield"],
            waasb_rank=r["waasb_rank"],
            yield_rank=r["yield_rank"]
        )
        for r in waasb_results
    ]

    results = engine.calculate_waasby(waasb_objs, yield_weight, stability_weight)
    return [{"genotype_id": r.genotype_id, "waasby": r.waasby,
             "yield_rank_score": r.yield_rank_score,
             "waasb_rank_score": r.waasb_rank_score,
             "waasby_rank": r.waasby_rank}
            for r in results]


def calculate_mtsi_from_js(engine, trait_matrix, genotype_names=None, selection_intensity=0.2):
    """JavaScript에서 MTSI 호출"""
    results = engine.calculate_mtsi(
        np.array(trait_matrix),
        genotype_names,
        selection_intensity
    )
    return [{"genotype_id": r.genotype_id, "mtsi": r.mtsi,
             "mtsi_rank": r.mtsi_rank, "selected": r.selected,
             "factor_scores": r.factor_scores}
            for r in results]


def identify_elite_from_js(engine, yield_matrix, genotype_names=None,
                          trait_matrix=None, selection_method="waasby", top_n=10):
    """JavaScript에서 엘리트 선발 호출"""
    return engine.identify_elite_parents(
        np.array(yield_matrix),
        genotype_names,
        np.array(trait_matrix) if trait_matrix is not None else None,
        selection_method,
        top_n
    )


# 모듈 로드 확인
print("[statistical_engine.py] 모듈 로드 완료")
