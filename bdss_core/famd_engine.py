"""
BDSS FAMD Engine - Factor Analysis of Mixed Data 통합 엔진

벼 육종 시스템에서 질적(SNP 마커) + 양적(형질) 데이터를 통합 분석하여
GA 최적화, 부모 매칭, ML 특성 추출에 활용합니다.

주요 기능:
1. FAMD 핵심 알고리즘 (PCA + MCA 통합)
2. 질적 형질 전처리 (순서형/명목형 구분)
3. 균형 정규화 (변수 개수 보정)
4. GA용 잠재 공간 생성
5. 부모 매칭용 FAMD 거리 계산
6. ML용 특성 추출

참고:
- FAMD = PCA(양적 변수) + MCA(질적 변수) 통합
- 정규화: Var_total = Σ(Var(Quant)/n_quant) + Σ(Var(Qual)/n_qual)
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Union
from enum import Enum
import numpy as np
from numpy.linalg import svd, norm
import logging

logger = logging.getLogger(__name__)


class QualitativeTraitType(Enum):
    """질적 형질 유형"""
    ORDINAL = "ordinal"    # 순서형 (R > MR > MS > S)
    NOMINAL = "nominal"    # 명목형 (찰/메, 향미 유/무)


@dataclass
class FAMDResult:
    """FAMD 분석 결과"""
    factor_scores: np.ndarray           # 개체별 주성분 점수 (n_samples × n_components)
    loadings_quant: np.ndarray          # 양적 변수 로딩 (n_quant × n_components)
    loadings_qual: np.ndarray           # 질적 변수 로딩 (n_qual_encoded × n_components)
    explained_variance: np.ndarray      # 각 성분의 설명 분산
    explained_variance_ratio: np.ndarray  # 설명 분산 비율
    cumulative_variance_ratio: np.ndarray  # 누적 설명 분산 비율
    n_components: int                   # 사용된 성분 수
    n_samples: int                      # 샘플 수
    n_quant: int                        # 양적 변수 수
    n_qual: int                         # 질적 변수 수 (인코딩 전)
    n_qual_encoded: int                 # 질적 변수 수 (인코딩 후)
    feature_names_quant: List[str]      # 양적 변수명
    feature_names_qual: List[str]       # 질적 변수명
    qual_categories: Dict[str, List[str]]  # 질적 변수별 범주 목록

    def get_top_contributors(
        self,
        component: int = 0,
        top_n: int = 10
    ) -> List[Tuple[str, float]]:
        """특정 성분에 가장 기여하는 변수들 반환"""
        # 양적 변수 기여도
        quant_contrib = [
            (name, abs(self.loadings_quant[i, component]))
            for i, name in enumerate(self.feature_names_quant)
        ]

        # 질적 변수 기여도 (인코딩된 더미 변수 합산)
        qual_contrib = []
        idx = 0
        for name in self.feature_names_qual:
            n_cats = len(self.qual_categories.get(name, []))
            if n_cats > 0:
                contrib = np.mean(np.abs(self.loadings_qual[idx:idx+n_cats, component]))
                qual_contrib.append((name, contrib))
                idx += n_cats

        all_contrib = quant_contrib + qual_contrib
        all_contrib.sort(key=lambda x: x[1], reverse=True)

        return all_contrib[:top_n]


@dataclass
class FAMDDistance:
    """FAMD 거리 계산 결과"""
    distances: np.ndarray               # 거리 배열
    indices: np.ndarray                 # 정렬된 인덱스 (가까운 순)
    target_scores: np.ndarray           # 타겟의 FAMD 점수
    candidate_scores: np.ndarray        # 후보들의 FAMD 점수


@dataclass
class LatentSpaceBounds:
    """GA용 잠재 공간 경계"""
    lower_bounds: np.ndarray            # 각 차원의 하한
    upper_bounds: np.ndarray            # 각 차원의 상한
    n_dims: int                         # 차원 수
    feasible_region: Optional[np.ndarray] = None  # 실현 가능 영역 (convex hull)


# 순서형 질적 형질 매핑 정의
ORDINAL_TRAIT_MAPPINGS = {
    # 저항성 등급 (4단계)
    'resistance_4level': {
        'R': 1.0, 'MR': 0.67, 'MS': 0.33, 'S': 0.0,
        '저항성': 1.0, '중도저항성': 0.67, '중도감수성': 0.33, '감수성': 0.0,
        'Resistant': 1.0, 'Moderately Resistant': 0.67,
        'Moderately Susceptible': 0.33, 'Susceptible': 0.0
    },
    # 저항성 등급 (3단계)
    'resistance_3level': {
        'R': 1.0, 'M': 0.5, 'S': 0.0,
        '저항성': 1.0, '중도': 0.5, '감수성': 0.0
    },
    # 이항 (유/무)
    'binary': {
        '유': 1.0, '무': 0.0,
        'Yes': 1.0, 'No': 0.0,
        'Present': 1.0, 'Absent': 0.0,
        '1': 1.0, '0': 0.0,
        1: 1.0, 0: 0.0
    },
    # SNP 마커 (R/S/H)
    'snp_marker': {
        'R': 1.0, 'H': 0.5, 'S': 0.0,
        '1': 1.0, '0.5': 0.5, '0': 0.0,
        1: 1.0, 0.5: 0.5, 0: 0.0,
        'X': 1.0  # Alternative allele
    }
}

# 질적 형질 유형 자동 감지 규칙
TRAIT_TYPE_RULES = {
    # 순서형으로 처리할 형질 패턴
    'ordinal_patterns': [
        '저항성', '저항', 'resistance', 'Resistance',
        '등급', 'grade', 'Grade', 'level', 'Level',
        '도열병', '흰잎마름병', '줄무늬잎마름병', '벼멸구',
        'blast', 'Blast', 'blight', 'Blight'
    ],
    # 명목형으로 처리할 형질 패턴
    'nominal_patterns': [
        '찰', '메', 'waxy', 'Waxy',
        '향', 'aroma', 'Aroma', 'fragrance',
        '까락', 'awn', 'Awn',
        '색', 'color', 'Color', 'colour'
    ]
}


class FAMDEngine:
    """
    FAMD (Factor Analysis of Mixed Data) 통합 엔진

    벼 육종 데이터의 질적(SNP, 질적형질) + 양적(형질값) 변수를
    통합 분석하여 저차원 잠재 공간을 생성합니다.

    사용 예시:
    ```python
    engine = FAMDEngine()

    # 데이터 준비
    quantitative = np.array([[650, 92.3], [580, 88.5], ...])  # 수량, 등숙률
    qualitative = np.array([['R', 'S'], ['S', 'R'], ...])     # 도열병, 흰잎마름병

    # FAMD 실행
    result = engine.fit_transform(
        quantitative, qualitative,
        quant_names=['수량', '등숙률'],
        qual_names=['도열병저항성', '흰잎마름병저항성'],
        n_components=5
    )

    # 결과 활용
    factor_scores = result.factor_scores  # ML 입력 특성
    explained = result.explained_variance_ratio  # 설명력 확인
    ```
    """

    def __init__(
        self,
        balance_variables: bool = True,
        ordinal_trait_mappings: Dict[str, Dict] = None,
        random_state: int = None
    ):
        """
        Args:
            balance_variables: 양적/질적 변수 균형 정규화 적용 여부
            ordinal_trait_mappings: 순서형 형질 수치 변환 매핑 (커스텀)
            random_state: 재현성을 위한 난수 시드
        """
        self.balance_variables = balance_variables
        self.ordinal_mappings = ordinal_trait_mappings or ORDINAL_TRAIT_MAPPINGS
        self.random_state = random_state

        # fit 후 저장되는 상태
        self._fitted = False
        self._quant_means: Optional[np.ndarray] = None
        self._quant_stds: Optional[np.ndarray] = None
        self._qual_encodings: Dict[str, Dict[str, int]] = {}
        self._n_quant: int = 0
        self._n_qual: int = 0
        self._n_qual_encoded: int = 0
        self._components: Optional[np.ndarray] = None
        self._singular_values: Optional[np.ndarray] = None

        logger.info(f"FAMDEngine 초기화 - balance={balance_variables}")

    def _identify_trait_type(self, trait_name: str, values: np.ndarray) -> QualitativeTraitType:
        """
        형질 유형 자동 감지 (순서형/명목형)

        Args:
            trait_name: 형질명
            values: 형질 값 배열

        Returns:
            QualitativeTraitType
        """
        trait_lower = trait_name.lower()

        # 패턴 매칭으로 순서형 확인
        for pattern in TRAIT_TYPE_RULES['ordinal_patterns']:
            if pattern.lower() in trait_lower:
                logger.debug(f"형질 '{trait_name}' → 순서형 (패턴 매칭: {pattern})")
                return QualitativeTraitType.ORDINAL

        # 패턴 매칭으로 명목형 확인
        for pattern in TRAIT_TYPE_RULES['nominal_patterns']:
            if pattern.lower() in trait_lower:
                logger.debug(f"형질 '{trait_name}' → 명목형 (패턴 매칭: {pattern})")
                return QualitativeTraitType.NOMINAL

        # 값 기반 추론
        unique_values = set(str(v).strip() for v in values if v is not None and str(v).strip())

        # R/MR/MS/S 패턴 확인
        resistance_patterns = {'R', 'MR', 'MS', 'S', 'r', 'mr', 'ms', 's'}
        if unique_values.issubset(resistance_patterns) or len(unique_values & resistance_patterns) >= 2:
            logger.debug(f"형질 '{trait_name}' → 순서형 (저항성 패턴)")
            return QualitativeTraitType.ORDINAL

        # 이항 패턴 확인
        binary_patterns = [{'유', '무'}, {'Yes', 'No'}, {'1', '0'}, {'Present', 'Absent'}]
        for pattern in binary_patterns:
            if unique_values == pattern or unique_values.issubset(pattern):
                logger.debug(f"형질 '{trait_name}' → 순서형 (이항)")
                return QualitativeTraitType.ORDINAL

        # 기본값: 명목형
        logger.debug(f"형질 '{trait_name}' → 명목형 (기본)")
        return QualitativeTraitType.NOMINAL

    def _convert_ordinal_to_numeric(
        self,
        values: np.ndarray,
        trait_name: str
    ) -> Tuple[np.ndarray, str]:
        """
        순서형 질적 형질을 수치로 변환

        Args:
            values: 형질 값 배열
            trait_name: 형질명

        Returns:
            (변환된 수치 배열, 사용된 매핑 유형)
        """
        result = np.zeros(len(values), dtype=float)
        mapping_used = None

        # 각 매핑 시도
        for mapping_name, mapping in self.ordinal_mappings.items():
            converted = []
            success = True

            for v in values:
                v_str = str(v).strip() if v is not None else ''
                if v_str in mapping:
                    converted.append(mapping[v_str])
                elif v in mapping:
                    converted.append(mapping[v])
                else:
                    success = False
                    break

            if success and len(converted) == len(values):
                result = np.array(converted, dtype=float)
                mapping_used = mapping_name
                break

        if mapping_used is None:
            # 매핑 실패 시 고유값 기반 등간격 변환
            unique_vals = sorted(set(str(v).strip() for v in values if v is not None))
            n_unique = len(unique_vals)
            auto_mapping = {v: i / (n_unique - 1) if n_unique > 1 else 0.5
                          for i, v in enumerate(unique_vals)}

            result = np.array([auto_mapping.get(str(v).strip(), 0.5) for v in values])
            mapping_used = 'auto'
            logger.warning(f"형질 '{trait_name}': 자동 매핑 적용 - {auto_mapping}")

        logger.debug(f"형질 '{trait_name}' 수치 변환 완료 (매핑: {mapping_used})")
        return result, mapping_used

    def _one_hot_encode(
        self,
        values: np.ndarray,
        trait_name: str
    ) -> Tuple[np.ndarray, List[str]]:
        """
        명목형 질적 형질을 One-hot 인코딩

        Args:
            values: 형질 값 배열
            trait_name: 형질명

        Returns:
            (인코딩된 행렬, 범주 목록)
        """
        # 고유 범주 추출 (정렬하여 일관성 유지)
        unique_cats = sorted(set(str(v).strip() for v in values if v is not None and str(v).strip()))
        n_cats = len(unique_cats)
        n_samples = len(values)

        # 인코딩 매핑 저장
        self._qual_encodings[trait_name] = {cat: i for i, cat in enumerate(unique_cats)}

        # One-hot 행렬 생성
        encoded = np.zeros((n_samples, n_cats), dtype=float)
        for i, v in enumerate(values):
            v_str = str(v).strip() if v is not None else ''
            if v_str in self._qual_encodings[trait_name]:
                idx = self._qual_encodings[trait_name][v_str]
                encoded[i, idx] = 1.0

        logger.debug(f"형질 '{trait_name}' One-hot 인코딩: {n_cats}개 범주")
        return encoded, unique_cats

    def preprocess_qualitative_traits(
        self,
        qualitative: np.ndarray,
        qual_names: List[str],
        trait_types: Dict[str, QualitativeTraitType] = None
    ) -> Tuple[np.ndarray, np.ndarray, List[str], List[str], Dict[str, List[str]]]:
        """
        질적 형질 전처리: 순서형 → 양적, 명목형 → 질적(One-hot)

        Args:
            qualitative: 질적 데이터 행렬 (n_samples × n_qual)
            qual_names: 질적 변수명 리스트
            trait_types: 형질별 유형 지정 (None이면 자동 감지)

        Returns:
            (추가_양적_데이터, 명목형_인코딩_데이터,
             추가_양적_변수명, 명목형_변수명, 범주_딕셔너리)
        """
        logger.info(f"질적 형질 전처리 시작: {len(qual_names)}개 변수")

        n_samples = qualitative.shape[0]

        # 결과 저장
        ordinal_as_quant = []  # 순서형 → 양적으로 변환
        ordinal_names = []
        nominal_encoded = []   # 명목형 → One-hot
        nominal_names = []
        nominal_categories = {}

        for i, name in enumerate(qual_names):
            values = qualitative[:, i]

            # 형질 유형 결정
            if trait_types and name in trait_types:
                trait_type = trait_types[name]
            else:
                trait_type = self._identify_trait_type(name, values)

            if trait_type == QualitativeTraitType.ORDINAL:
                # 순서형 → 수치 변환 → 양적 변수로
                numeric_values, _ = self._convert_ordinal_to_numeric(values, name)
                ordinal_as_quant.append(numeric_values)
                ordinal_names.append(name)
                logger.info(f"  '{name}' → 순서형 → 양적 변수로 변환")

            else:  # NOMINAL
                # 명목형 → One-hot 인코딩 → 질적 변수 유지
                encoded, categories = self._one_hot_encode(values, name)
                nominal_encoded.append(encoded)
                nominal_names.append(name)
                nominal_categories[name] = categories
                logger.info(f"  '{name}' → 명목형 → {len(categories)}개 더미 변수")

        # 배열로 변환
        ordinal_array = np.column_stack(ordinal_as_quant) if ordinal_as_quant else np.empty((n_samples, 0))
        nominal_array = np.hstack(nominal_encoded) if nominal_encoded else np.empty((n_samples, 0))

        logger.info(f"전처리 완료: 순서형 {len(ordinal_names)}개 → 양적, "
                   f"명목형 {len(nominal_names)}개 → {nominal_array.shape[1]}개 더미")

        return ordinal_array, nominal_array, ordinal_names, nominal_names, nominal_categories

    def fit_transform(
        self,
        quantitative: np.ndarray,
        qualitative: np.ndarray,
        quant_names: List[str] = None,
        qual_names: List[str] = None,
        n_components: int = None,
        trait_types: Dict[str, QualitativeTraitType] = None,
        weights: Dict[str, float] = None
    ) -> FAMDResult:
        """
        FAMD 분석 실행 (fit + transform)

        정규화 공식 적용:
        Var_total = Σ(Var(Quant)/n_quant) + Σ(Var(Qual)/n_qual)
        → 변수 개수와 무관하게 양적/질적 균형 유지

        Args:
            quantitative: 양적 데이터 행렬 (n_samples × n_quant)
            qualitative: 질적 데이터 행렬 (n_samples × n_qual)
            quant_names: 양적 변수명 리스트
            qual_names: 질적 변수명 리스트
            n_components: 추출할 성분 수 (None이면 자동)
            trait_types: 질적 형질 유형 지정 (순서형/명목형)
            weights: 변수별 가중치 (특정 형질 강조)

        Returns:
            FAMDResult 객체
        """
        logger.info("=" * 60)
        logger.info("FAMD 분석 시작")
        logger.info(f"입력: 양적 {quantitative.shape}, 질적 {qualitative.shape}")

        n_samples = quantitative.shape[0]

        # 변수명 기본값
        if quant_names is None:
            quant_names = [f"Quant_{i}" for i in range(quantitative.shape[1])]
        if qual_names is None:
            qual_names = [f"Qual_{i}" for i in range(qualitative.shape[1])]

        # Step 1: 질적 형질 전처리 (순서형 → 양적, 명목형 → One-hot)
        ordinal_quant, nominal_encoded, ordinal_names, nominal_names, nominal_categories = \
            self.preprocess_qualitative_traits(qualitative, qual_names, trait_types)

        # Step 2: 양적 데이터 통합 (원본 + 순서형에서 변환된 것)
        all_quant = np.hstack([quantitative, ordinal_quant]) if ordinal_quant.size > 0 else quantitative
        all_quant_names = quant_names + ordinal_names

        n_quant = all_quant.shape[1]
        n_qual_encoded = nominal_encoded.shape[1] if nominal_encoded.size > 0 else 0

        logger.info(f"통합 후: 양적 {n_quant}개, 질적(인코딩) {n_qual_encoded}개")

        # Step 3: 양적 변수 표준화
        self._quant_means = np.mean(all_quant, axis=0)
        self._quant_stds = np.std(all_quant, axis=0, ddof=1)
        self._quant_stds[self._quant_stds == 0] = 1  # 상수 변수 처리

        quant_standardized = (all_quant - self._quant_means) / self._quant_stds

        # Step 4: 질적 변수 중심화 (One-hot 인코딩 후)
        if n_qual_encoded > 0:
            # 각 범주의 평균 빈도로 중심화
            qual_means = np.mean(nominal_encoded, axis=0)
            qual_centered = nominal_encoded - qual_means
        else:
            qual_centered = np.empty((n_samples, 0))

        # Step 5: 균형 정규화 (변수 개수 보정)
        if self.balance_variables and n_quant > 0 and n_qual_encoded > 0:
            # Var_total = Σ(Var(Quant)/n_quant) + Σ(Var(Qual)/n_qual)
            quant_normalized = quant_standardized / np.sqrt(n_quant)
            qual_normalized = qual_centered / np.sqrt(n_qual_encoded)
            logger.info(f"균형 정규화 적용: sqrt({n_quant}), sqrt({n_qual_encoded})")
        else:
            quant_normalized = quant_standardized
            qual_normalized = qual_centered

        # Step 6: 가중치 적용 (선택적)
        if weights:
            logger.info(f"가중치 적용: {weights}")
            for i, name in enumerate(all_quant_names):
                if name in weights:
                    quant_normalized[:, i] *= np.sqrt(weights[name])
            # 질적 변수 가중치는 범주 단위로 적용
            idx = 0
            for name in nominal_names:
                n_cats = len(nominal_categories.get(name, []))
                if name in weights and n_cats > 0:
                    qual_normalized[:, idx:idx+n_cats] *= np.sqrt(weights[name])
                idx += n_cats

        # Step 7: 통합 행렬 구성
        if qual_normalized.size > 0:
            combined = np.hstack([quant_normalized, qual_normalized])
        else:
            combined = quant_normalized

        logger.info(f"통합 행렬: {combined.shape}")

        # Step 8: SVD 분해
        U, S, Vt = svd(combined, full_matrices=False)

        # 성분 수 결정
        if n_components is None:
            # Kaiser 기준 (고유값 > 평균) 또는 누적 분산 90%
            eigenvalues = S ** 2 / (n_samples - 1)
            mean_eigenvalue = np.mean(eigenvalues)
            n_components = max(1, np.sum(eigenvalues > mean_eigenvalue))
            n_components = min(n_components, min(n_samples, combined.shape[1]) - 1)

        n_components = min(n_components, len(S))

        logger.info(f"선택된 성분 수: {n_components}")

        # Step 9: 결과 계산
        # 주성분 점수
        factor_scores = U[:, :n_components] * S[:n_components]

        # 로딩 (변수별 기여도)
        loadings = Vt[:n_components, :].T * S[:n_components]
        loadings_quant = loadings[:n_quant, :]
        loadings_qual = loadings[n_quant:, :] if n_qual_encoded > 0 else np.empty((0, n_components))

        # 설명 분산
        total_variance = np.sum(S ** 2)
        explained_variance = (S[:n_components] ** 2)
        explained_variance_ratio = explained_variance / total_variance
        cumulative_variance_ratio = np.cumsum(explained_variance_ratio)

        # 상태 저장
        self._fitted = True
        self._n_quant = n_quant
        self._n_qual = len(nominal_names)
        self._n_qual_encoded = n_qual_encoded
        self._components = Vt[:n_components, :]
        self._singular_values = S[:n_components]

        logger.info(f"FAMD 완료 - 설명 분산: {cumulative_variance_ratio[-1]*100:.1f}% "
                   f"({n_components}개 성분)")
        logger.info("=" * 60)

        return FAMDResult(
            factor_scores=factor_scores,
            loadings_quant=loadings_quant,
            loadings_qual=loadings_qual,
            explained_variance=explained_variance,
            explained_variance_ratio=explained_variance_ratio,
            cumulative_variance_ratio=cumulative_variance_ratio,
            n_components=n_components,
            n_samples=n_samples,
            n_quant=n_quant,
            n_qual=len(nominal_names),
            n_qual_encoded=n_qual_encoded,
            feature_names_quant=all_quant_names,
            feature_names_qual=nominal_names,
            qual_categories=nominal_categories
        )

    def transform(
        self,
        quantitative: np.ndarray,
        qualitative: np.ndarray,
        qual_names: List[str] = None,
        trait_types: Dict[str, QualitativeTraitType] = None
    ) -> np.ndarray:
        """
        새로운 데이터를 기존 FAMD 공간으로 투영

        Args:
            quantitative: 양적 데이터
            qualitative: 질적 데이터
            qual_names: 질적 변수명
            trait_types: 형질 유형

        Returns:
            투영된 주성분 점수
        """
        if not self._fitted:
            raise RuntimeError("FAMD가 먼저 fit되어야 합니다")

        # 전처리 및 표준화 (fit 시와 동일한 파라미터 사용)
        # ... (구현 생략 - fit_transform과 유사)

        raise NotImplementedError("transform은 추후 구현 예정")

    # =========================================================================
    # Phase 2: 부모 매칭용 FAMD 거리 계산
    # =========================================================================

    def calculate_distance(
        self,
        target_scores: np.ndarray,
        candidate_scores: np.ndarray,
        component_weights: np.ndarray = None
    ) -> FAMDDistance:
        """
        FAMD 공간에서 유클리드 거리 계산

        Args:
            target_scores: 타겟(이상적 해)의 FAMD 점수 (1 × n_components)
            candidate_scores: 후보들의 FAMD 점수 (n_candidates × n_components)
            component_weights: 성분별 가중치 (설명 분산 비율 등)

        Returns:
            FAMDDistance 객체
        """
        logger.info(f"FAMD 거리 계산: 타겟 1개 vs 후보 {len(candidate_scores)}개")

        target = target_scores.flatten()

        if component_weights is not None:
            # 가중 거리
            weights = np.sqrt(component_weights)
            diff = (candidate_scores - target) * weights
        else:
            diff = candidate_scores - target

        distances = np.sqrt(np.sum(diff ** 2, axis=1))

        # 가까운 순으로 정렬
        sorted_indices = np.argsort(distances)

        return FAMDDistance(
            distances=distances,
            indices=sorted_indices,
            target_scores=target_scores,
            candidate_scores=candidate_scores
        )

    def find_closest_parents(
        self,
        ideal_scores: np.ndarray,
        parent_pool_scores: np.ndarray,
        parent_names: List[str],
        top_n: int = 10,
        use_variance_weights: bool = True,
        explained_variance_ratio: np.ndarray = None
    ) -> List[Dict[str, Any]]:
        """
        이상적 해에 가장 가까운 부모 N개 선정

        Args:
            ideal_scores: 이상적 해의 FAMD 점수
            parent_pool_scores: 후보 부모들의 FAMD 점수
            parent_names: 부모 이름 리스트
            top_n: 선정할 부모 수
            use_variance_weights: 설명 분산으로 가중치 부여 여부
            explained_variance_ratio: 성분별 설명 분산 비율

        Returns:
            선정된 부모 정보 리스트
        """
        logger.info(f"최적 부모 탐색: {len(parent_names)}개 후보 중 상위 {top_n}개")

        # 가중치 설정
        weights = None
        if use_variance_weights and explained_variance_ratio is not None:
            weights = explained_variance_ratio

        # 거리 계산
        distance_result = self.calculate_distance(
            ideal_scores, parent_pool_scores, weights
        )

        # 상위 N개 선정
        results = []
        for rank, idx in enumerate(distance_result.indices[:top_n]):
            results.append({
                'rank': rank + 1,
                'name': parent_names[idx],
                'index': int(idx),
                'distance': float(distance_result.distances[idx]),
                'famd_scores': parent_pool_scores[idx].tolist(),
                'similarity': float(1 / (1 + distance_result.distances[idx]))  # 거리 → 유사도 변환
            })
            logger.debug(f"  {rank+1}. {parent_names[idx]}: 거리={distance_result.distances[idx]:.4f}")

        return results

    def find_complementary_parents(
        self,
        parent1_scores: np.ndarray,
        parent_pool_scores: np.ndarray,
        parent_names: List[str],
        target_scores: np.ndarray = None,
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        상보적 부모 쌍 탐색 (교배 조합 추천)

        두 부모의 FAMD 좌표 중점이 타겟에 가까운 조합을 찾습니다.

        Args:
            parent1_scores: 첫 번째 부모의 FAMD 점수
            parent_pool_scores: 후보 부모들의 FAMD 점수
            parent_names: 부모 이름 리스트
            target_scores: 목표 FAMD 점수 (None이면 원점)
            top_n: 반환할 조합 수

        Returns:
            상보적 부모 조합 리스트
        """
        logger.info(f"상보적 부모 탐색: 기준 부모 1개 vs 후보 {len(parent_names)}개")

        if target_scores is None:
            target_scores = np.zeros(parent1_scores.shape)

        p1 = parent1_scores.flatten()
        target = target_scores.flatten()

        results = []
        for i, (p2_scores, name) in enumerate(zip(parent_pool_scores, parent_names)):
            # 두 부모의 중점 (F1 예상 위치)
            midpoint = (p1 + p2_scores) / 2

            # 중점과 타겟 간 거리
            distance_to_target = norm(midpoint - target)

            # 두 부모 간 거리 (유전적 다양성)
            parent_distance = norm(p1 - p2_scores)

            results.append({
                'index': i,
                'name': name,
                'midpoint': midpoint.tolist(),
                'distance_to_target': float(distance_to_target),
                'parent_distance': float(parent_distance),
                'complementarity_score': float(parent_distance / (1 + distance_to_target))
            })

        # 상보성 점수로 정렬 (높을수록 좋음)
        results.sort(key=lambda x: x['complementarity_score'], reverse=True)

        for rank, r in enumerate(results[:top_n]):
            r['rank'] = rank + 1
            logger.debug(f"  {rank+1}. {r['name']}: 상보성={r['complementarity_score']:.4f}")

        return results[:top_n]

    # =========================================================================
    # Phase 3: GA용 잠재 공간
    # =========================================================================

    def create_latent_space_bounds(
        self,
        famd_result: FAMDResult,
        margin: float = 0.1
    ) -> LatentSpaceBounds:
        """
        GA 탐색을 위한 잠재 공간 경계 생성

        Args:
            famd_result: FAMD 분석 결과
            margin: 경계 여유 (비율)

        Returns:
            LatentSpaceBounds 객체
        """
        scores = famd_result.factor_scores

        # 각 차원의 최소/최대값
        mins = np.min(scores, axis=0)
        maxs = np.max(scores, axis=0)

        # 여유 적용
        ranges = maxs - mins
        lower_bounds = mins - margin * ranges
        upper_bounds = maxs + margin * ranges

        logger.info(f"잠재 공간 경계 생성: {famd_result.n_components}차원")

        return LatentSpaceBounds(
            lower_bounds=lower_bounds,
            upper_bounds=upper_bounds,
            n_dims=famd_result.n_components
        )

    def decode_latent_to_traits(
        self,
        latent_vector: np.ndarray,
        famd_result: FAMDResult
    ) -> Dict[str, float]:
        """
        잠재 공간 좌표를 형질 값으로 근사 복원

        주의: 정확한 복원이 아닌 근사값입니다.

        Args:
            latent_vector: 잠재 공간 좌표
            famd_result: FAMD 결과

        Returns:
            형질별 근사값 딕셔너리
        """
        # 로딩 행렬의 의사역행렬로 복원
        loadings_quant = famd_result.loadings_quant

        # 최소제곱법으로 양적 변수 복원
        reconstructed_quant = np.linalg.lstsq(
            loadings_quant, latent_vector, rcond=None
        )[0]

        # 표준화 역변환
        if self._quant_means is not None and self._quant_stds is not None:
            reconstructed_quant = reconstructed_quant * self._quant_stds + self._quant_means

        result = {
            name: float(val)
            for name, val in zip(famd_result.feature_names_quant, reconstructed_quant)
        }

        return result

    def is_biologically_feasible(
        self,
        latent_vector: np.ndarray,
        famd_result: FAMDResult,
        threshold: float = 2.0
    ) -> Tuple[bool, float]:
        """
        잠재 공간 좌표가 생물학적으로 실현 가능한지 검증

        기존 데이터 분포를 벗어난 극단적 조합은 불가능할 수 있음.

        Args:
            latent_vector: 검증할 좌표
            famd_result: FAMD 결과
            threshold: Mahalanobis 거리 임계값

        Returns:
            (가능 여부, Mahalanobis 거리)
        """
        scores = famd_result.factor_scores

        # 중심 및 공분산
        center = np.mean(scores, axis=0)
        cov = np.cov(scores.T)

        # Mahalanobis 거리
        diff = latent_vector - center
        try:
            cov_inv = np.linalg.inv(cov)
            mahal_dist = np.sqrt(diff @ cov_inv @ diff)
        except np.linalg.LinAlgError:
            # 공분산 행렬이 특이한 경우 유클리드 거리 사용
            mahal_dist = norm(diff) / np.mean(np.std(scores, axis=0))

        is_feasible = mahal_dist <= threshold

        logger.debug(f"생물학적 실현 가능성: {is_feasible} (거리={mahal_dist:.2f}, 임계={threshold})")

        return is_feasible, float(mahal_dist)

    # =========================================================================
    # ML 특성 추출
    # =========================================================================

    def extract_ml_features(
        self,
        famd_result: FAMDResult,
        n_features: int = None,
        min_variance_ratio: float = 0.01
    ) -> Tuple[np.ndarray, List[str]]:
        """
        ML 모델 입력용 특성 추출

        Args:
            famd_result: FAMD 결과
            n_features: 추출할 특성 수 (None이면 자동)
            min_variance_ratio: 포함할 최소 분산 비율

        Returns:
            (특성 행렬, 특성명 리스트)
        """
        if n_features is None:
            # 최소 분산 비율 이상인 성분만 선택
            n_features = np.sum(famd_result.explained_variance_ratio >= min_variance_ratio)
            n_features = max(1, n_features)

        n_features = min(n_features, famd_result.n_components)

        features = famd_result.factor_scores[:, :n_features]
        feature_names = [f"FAMD_Dim{i+1}" for i in range(n_features)]

        logger.info(f"ML 특성 추출: {n_features}개 (설명 분산 "
                   f"{famd_result.cumulative_variance_ratio[n_features-1]*100:.1f}%)")

        return features, feature_names


# =============================================================================
# 유틸리티 함수
# =============================================================================

def create_test_dataset(
    n_samples: int = 30,
    n_quant: int = 4,
    n_qual: int = 5,
    random_state: int = 42
) -> Tuple[np.ndarray, np.ndarray, List[str], List[str]]:
    """
    테스트용 혼합 데이터셋 생성

    Args:
        n_samples: 샘플 수
        n_quant: 양적 변수 수
        n_qual: 질적 변수 수
        random_state: 난수 시드

    Returns:
        (양적 데이터, 질적 데이터, 양적 변수명, 질적 변수명)
    """
    np.random.seed(random_state)

    # 양적 변수 (형질)
    quant_names = ['수량', '등숙률', '초장', '단백질함량'][:n_quant]
    quantitative = np.random.randn(n_samples, n_quant)
    # 현실적인 범위로 스케일링
    scales = [100, 10, 20, 2][:n_quant]
    offsets = [600, 85, 100, 7][:n_quant]
    quantitative = quantitative * scales + offsets

    # 질적 변수 (SNP 마커 + 질적 형질)
    qual_names = ['도열병저항성', '흰잎마름병저항성', 'Rf4', 'Sub1A', '찰메성'][:n_qual]
    qualitative = []

    categories_map = {
        '도열병저항성': ['R', 'MR', 'MS', 'S'],
        '흰잎마름병저항성': ['R', 'MR', 'MS', 'S'],
        'Rf4': ['R', 'H', 'S'],
        'Sub1A': ['R', 'S'],
        '찰메성': ['찰', '메']
    }

    for name in qual_names:
        cats = categories_map.get(name, ['A', 'B', 'C'])
        qualitative.append(np.random.choice(cats, n_samples))

    qualitative = np.column_stack(qualitative)

    return quantitative, qualitative, quant_names, qual_names


def example_famd_analysis():
    """FAMD 분석 예제"""
    print("=" * 70)
    print("FAMD (Factor Analysis of Mixed Data) 분석 예제")
    print("=" * 70)

    # 테스트 데이터 생성
    quantitative, qualitative, quant_names, qual_names = create_test_dataset(
        n_samples=30, n_quant=4, n_qual=5
    )

    print(f"\n입력 데이터:")
    print(f"  - 양적 변수: {quant_names}")
    print(f"  - 질적 변수: {qual_names}")
    print(f"  - 샘플 수: {len(quantitative)}")

    # FAMD 엔진 생성 및 분석
    engine = FAMDEngine(balance_variables=True)

    result = engine.fit_transform(
        quantitative, qualitative,
        quant_names=quant_names,
        qual_names=qual_names,
        n_components=5
    )

    # 결과 출력
    print(f"\n분석 결과:")
    print(f"  - 추출된 성분 수: {result.n_components}")
    print(f"  - 양적 변수 (변환 후): {result.n_quant}개")
    print(f"  - 질적 변수 (인코딩 후): {result.n_qual_encoded}개")

    print(f"\n설명 분산 비율:")
    for i, (var, cum) in enumerate(zip(result.explained_variance_ratio,
                                       result.cumulative_variance_ratio)):
        print(f"  Dim {i+1}: {var*100:6.2f}% (누적: {cum*100:6.2f}%)")

    print(f"\n주요 기여 변수 (Dim 1):")
    for name, contrib in result.get_top_contributors(component=0, top_n=5):
        print(f"  - {name}: {contrib:.4f}")

    # 부모 매칭 예제
    print("\n" + "=" * 70)
    print("부모 매칭 예제")
    print("=" * 70)

    # 가상의 이상적 해 (첫 번째 샘플을 타겟으로)
    ideal_scores = result.factor_scores[0:1, :]
    parent_pool_scores = result.factor_scores[1:, :]
    parent_names = [f"품종{i+2:02d}" for i in range(len(parent_pool_scores))]

    closest = engine.find_closest_parents(
        ideal_scores, parent_pool_scores, parent_names,
        top_n=5,
        use_variance_weights=True,
        explained_variance_ratio=result.explained_variance_ratio
    )

    print(f"\n타겟에 가장 가까운 부모:")
    for p in closest:
        print(f"  {p['rank']}. {p['name']}: 거리={p['distance']:.4f}, 유사도={p['similarity']:.4f}")

    # ML 특성 추출 예제
    print("\n" + "=" * 70)
    print("ML 특성 추출 예제")
    print("=" * 70)

    ml_features, feature_names = engine.extract_ml_features(result, n_features=3)
    print(f"\n추출된 특성: {feature_names}")
    print(f"특성 행렬 shape: {ml_features.shape}")
    print(f"처음 5개 샘플:")
    print(ml_features[:5, :])

    return result


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    example_famd_analysis()
