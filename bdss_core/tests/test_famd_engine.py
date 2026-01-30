"""
FAMD Engine 테스트 모듈

테스트 항목:
1. 질적 형질 전처리 (순서형/명목형 분류)
2. FAMD 핵심 알고리즘 (SVD, 정규화)
3. 균형 정규화 공식 검증
4. 부모 매칭 거리 계산
5. GA 잠재 공간 생성
6. ML 특성 추출
"""

try:
    import pytest
except ImportError:
    pytest = None  # pytest 없이도 실행 가능

try:
    import numpy as np
    from numpy.testing import assert_array_almost_equal, assert_allclose
    NUMPY_AVAILABLE = True
except ImportError:
    NUMPY_AVAILABLE = False
    print("경고: numpy가 설치되지 않았습니다. 테스트를 실행하려면 numpy가 필요합니다.")
    print("설치: pip install numpy")
import sys
import os

# 상위 디렉토리를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from famd_engine import (
    FAMDEngine,
    FAMDResult,
    QualitativeTraitType,
    create_test_dataset,
    ORDINAL_TRAIT_MAPPINGS
)


class TestQualitativeTraitPreprocessing:
    """질적 형질 전처리 테스트"""

    def setup_method(self):
        """각 테스트 전 실행"""
        self.engine = FAMDEngine(balance_variables=True)

    def test_ordinal_trait_detection(self):
        """순서형 형질 자동 감지 테스트"""
        # 저항성 패턴
        values = np.array(['R', 'MR', 'MS', 'S', 'R'])
        trait_type = self.engine._identify_trait_type('도열병저항성', values)
        assert trait_type == QualitativeTraitType.ORDINAL
        print(f"순서형 감지 테스트 통과: 도열병저항성 → {trait_type}")

    def test_nominal_trait_detection(self):
        """명목형 형질 자동 감지 테스트"""
        values = np.array(['찰', '메', '찰', '메', '찰'])
        trait_type = self.engine._identify_trait_type('찰메성', values)
        assert trait_type == QualitativeTraitType.NOMINAL
        print(f"명목형 감지 테스트 통과: 찰메성 → {trait_type}")

    def test_ordinal_to_numeric_conversion(self):
        """순서형 → 수치 변환 테스트"""
        values = np.array(['R', 'MR', 'MS', 'S'])
        numeric, mapping_used = self.engine._convert_ordinal_to_numeric(values, '저항성')

        expected = np.array([1.0, 0.67, 0.33, 0.0])
        assert_allclose(numeric, expected, atol=0.01)
        print(f"수치 변환 테스트 통과: {values} → {numeric}")

    def test_binary_trait_conversion(self):
        """이항 형질 변환 테스트"""
        values = np.array(['유', '무', '유', '무'])
        numeric, _ = self.engine._convert_ordinal_to_numeric(values, '향미')

        assert numeric[0] == 1.0
        assert numeric[1] == 0.0
        print(f"이항 변환 테스트 통과: {values} → {numeric}")

    def test_one_hot_encoding(self):
        """One-hot 인코딩 테스트"""
        values = np.array(['찰', '메', '찰', '메', '찰'])
        encoded, categories = self.engine._one_hot_encode(values, '찰메성')

        assert encoded.shape == (5, 2)
        assert len(categories) == 2
        assert set(categories) == {'메', '찰'}
        print(f"One-hot 인코딩 테스트 통과: {categories}")

    def test_preprocess_mixed_traits(self):
        """혼합 형질 전처리 테스트"""
        qualitative = np.array([
            ['R', '찰'],
            ['S', '메'],
            ['MR', '찰'],
            ['MS', '메']
        ])
        qual_names = ['도열병저항성', '찰메성']

        ordinal_quant, nominal_encoded, ordinal_names, nominal_names, categories = \
            self.engine.preprocess_qualitative_traits(qualitative, qual_names)

        # 도열병저항성 → 순서형 → 양적
        assert '도열병저항성' in ordinal_names
        assert ordinal_quant.shape == (4, 1)

        # 찰메성 → 명목형 → One-hot
        assert '찰메성' in nominal_names
        assert nominal_encoded.shape == (4, 2)

        print(f"혼합 형질 전처리 테스트 통과")
        print(f"  순서형 → 양적: {ordinal_names}")
        print(f"  명목형 → One-hot: {nominal_names}")


class TestFAMDCoreAlgorithm:
    """FAMD 핵심 알고리즘 테스트"""

    def setup_method(self):
        self.engine = FAMDEngine(balance_variables=True)
        self.quantitative, self.qualitative, self.quant_names, self.qual_names = \
            create_test_dataset(n_samples=30, n_quant=4, n_qual=5, random_state=42)

    def test_famd_basic_execution(self):
        """FAMD 기본 실행 테스트"""
        result = self.engine.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names
        )

        assert isinstance(result, FAMDResult)
        assert result.n_samples == 30
        assert result.factor_scores.shape[0] == 30
        print(f"FAMD 기본 실행 테스트 통과: {result.n_components}개 성분")

    def test_explained_variance_sum(self):
        """설명 분산 합계 테스트"""
        result = self.engine.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names,
            n_components=10
        )

        # 누적 분산이 1 이하
        assert result.cumulative_variance_ratio[-1] <= 1.0
        # 분산 비율이 내림차순
        assert all(result.explained_variance_ratio[i] >= result.explained_variance_ratio[i+1]
                  for i in range(len(result.explained_variance_ratio)-1))
        print(f"설명 분산 테스트 통과: 누적 {result.cumulative_variance_ratio[-1]*100:.1f}%")

    def test_balance_normalization(self):
        """균형 정규화 테스트"""
        # 균형 정규화 ON
        engine_balanced = FAMDEngine(balance_variables=True)
        result_balanced = engine_balanced.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names
        )

        # 균형 정규화 OFF
        engine_unbalanced = FAMDEngine(balance_variables=False)
        result_unbalanced = engine_unbalanced.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names
        )

        # 결과가 달라야 함
        assert not np.allclose(result_balanced.factor_scores, result_unbalanced.factor_scores)
        print("균형 정규화 테스트 통과: ON/OFF 결과 상이")

    def test_weighted_famd(self):
        """가중 FAMD 테스트"""
        weights = {'수량': 2.0, '등숙률': 1.5}

        result_weighted = self.engine.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names,
            weights=weights
        )

        # 가중치가 적용되면 수량이 주요 기여 변수가 될 가능성 높음
        top_contributors = result_weighted.get_top_contributors(component=0, top_n=3)
        contributor_names = [name for name, _ in top_contributors]

        print(f"가중 FAMD 테스트 통과")
        print(f"  가중치: {weights}")
        print(f"  상위 기여 변수: {contributor_names}")

    def test_n_components_selection(self):
        """성분 수 선택 테스트"""
        # 자동 선택
        result_auto = self.engine.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names,
            n_components=None
        )

        # 수동 선택 (3개)
        result_manual = self.engine.fit_transform(
            self.quantitative, self.qualitative,
            quant_names=self.quant_names,
            qual_names=self.qual_names,
            n_components=3
        )

        assert result_manual.n_components == 3
        assert result_manual.factor_scores.shape[1] == 3
        print(f"성분 수 선택 테스트 통과: 자동={result_auto.n_components}, 수동=3")


class TestParentMatching:
    """부모 매칭 테스트"""

    def setup_method(self):
        self.engine = FAMDEngine()
        quantitative, qualitative, quant_names, qual_names = \
            create_test_dataset(n_samples=30, random_state=42)

        self.result = self.engine.fit_transform(
            quantitative, qualitative,
            quant_names=quant_names,
            qual_names=qual_names,
            n_components=5
        )
        self.parent_names = [f"품종{i+1:02d}" for i in range(30)]

    def test_calculate_distance(self):
        """FAMD 거리 계산 테스트"""
        target = self.result.factor_scores[0:1, :]
        candidates = self.result.factor_scores[1:, :]

        distance_result = self.engine.calculate_distance(target, candidates)

        assert len(distance_result.distances) == 29
        assert len(distance_result.indices) == 29
        # 거리는 양수
        assert all(d >= 0 for d in distance_result.distances)
        print(f"거리 계산 테스트 통과: {len(distance_result.distances)}개 후보")

    def test_find_closest_parents(self):
        """최적 부모 탐색 테스트"""
        ideal = self.result.factor_scores[0:1, :]
        pool = self.result.factor_scores[1:, :]
        names = self.parent_names[1:]

        closest = self.engine.find_closest_parents(
            ideal, pool, names,
            top_n=5,
            use_variance_weights=True,
            explained_variance_ratio=self.result.explained_variance_ratio
        )

        assert len(closest) == 5
        assert closest[0]['rank'] == 1
        # 거리가 정렬되어 있는지
        distances = [p['distance'] for p in closest]
        assert distances == sorted(distances)
        print(f"최적 부모 탐색 테스트 통과: 상위 5개 = {[p['name'] for p in closest]}")

    def test_find_complementary_parents(self):
        """상보적 부모 탐색 테스트"""
        parent1 = self.result.factor_scores[0, :]
        pool = self.result.factor_scores[1:, :]
        names = self.parent_names[1:]

        complementary = self.engine.find_complementary_parents(
            parent1, pool, names,
            target_scores=None,  # 원점 타겟
            top_n=5
        )

        assert len(complementary) == 5
        assert 'complementarity_score' in complementary[0]
        print(f"상보적 부모 탐색 테스트 통과")

    def test_self_distance_is_zero(self):
        """자기 자신과의 거리 = 0 테스트"""
        target = self.result.factor_scores[0:1, :]
        same = self.result.factor_scores[0:1, :]

        distance_result = self.engine.calculate_distance(target, same)
        assert_allclose(distance_result.distances[0], 0.0, atol=1e-10)
        print("자기 거리 = 0 테스트 통과")


class TestGALatentSpace:
    """GA 잠재 공간 테스트"""

    def setup_method(self):
        self.engine = FAMDEngine()
        quantitative, qualitative, quant_names, qual_names = \
            create_test_dataset(n_samples=30, random_state=42)

        self.result = self.engine.fit_transform(
            quantitative, qualitative,
            quant_names=quant_names,
            qual_names=qual_names,
            n_components=5
        )

    def test_create_latent_space_bounds(self):
        """잠재 공간 경계 생성 테스트"""
        bounds = self.engine.create_latent_space_bounds(self.result, margin=0.1)

        assert bounds.n_dims == self.result.n_components
        assert len(bounds.lower_bounds) == bounds.n_dims
        assert len(bounds.upper_bounds) == bounds.n_dims
        # 상한 > 하한
        assert all(bounds.upper_bounds[i] > bounds.lower_bounds[i]
                  for i in range(bounds.n_dims))
        print(f"잠재 공간 경계 테스트 통과: {bounds.n_dims}차원")

    def test_biological_feasibility_inside(self):
        """생물학적 실현 가능성 (내부) 테스트"""
        # 기존 데이터 포인트는 실현 가능해야 함
        test_vector = self.result.factor_scores[0, :]
        is_feasible, distance = self.engine.is_biologically_feasible(
            test_vector, self.result, threshold=3.0
        )

        assert is_feasible
        print(f"내부 점 실현 가능성 테스트 통과: 거리={distance:.2f}")

    def test_biological_feasibility_outside(self):
        """생물학적 실현 가능성 (외부) 테스트"""
        # 극단적인 값은 실현 불가능해야 함
        extreme_vector = np.ones(self.result.n_components) * 100
        is_feasible, distance = self.engine.is_biologically_feasible(
            extreme_vector, self.result, threshold=3.0
        )

        assert not is_feasible
        print(f"외부 점 실현 가능성 테스트 통과: 거리={distance:.2f}")

    def test_decode_latent_to_traits(self):
        """잠재 공간 → 형질 복원 테스트"""
        latent_vector = self.result.factor_scores[0, :]
        decoded = self.engine.decode_latent_to_traits(latent_vector, self.result)

        assert isinstance(decoded, dict)
        assert len(decoded) == self.result.n_quant
        print(f"형질 복원 테스트 통과: {list(decoded.keys())}")


class TestMLFeatureExtraction:
    """ML 특성 추출 테스트"""

    def setup_method(self):
        self.engine = FAMDEngine()
        quantitative, qualitative, quant_names, qual_names = \
            create_test_dataset(n_samples=30, random_state=42)

        self.result = self.engine.fit_transform(
            quantitative, qualitative,
            quant_names=quant_names,
            qual_names=qual_names,
            n_components=5
        )

    def test_extract_ml_features_auto(self):
        """ML 특성 자동 추출 테스트"""
        features, names = self.engine.extract_ml_features(
            self.result, n_features=None, min_variance_ratio=0.05
        )

        assert features.shape[0] == 30
        assert len(names) == features.shape[1]
        print(f"ML 특성 자동 추출 테스트 통과: {len(names)}개 특성")

    def test_extract_ml_features_manual(self):
        """ML 특성 수동 추출 테스트"""
        features, names = self.engine.extract_ml_features(
            self.result, n_features=3
        )

        assert features.shape == (30, 3)
        assert names == ['FAMD_Dim1', 'FAMD_Dim2', 'FAMD_Dim3']
        print(f"ML 특성 수동 추출 테스트 통과: {names}")

    def test_features_orthogonality(self):
        """추출된 특성의 직교성 테스트"""
        features, _ = self.engine.extract_ml_features(self.result, n_features=3)

        # 특성 간 상관계수 계산
        corr_matrix = np.corrcoef(features.T)

        # 비대각 요소는 0에 가까워야 함
        off_diag = corr_matrix[np.triu_indices(3, k=1)]
        assert_allclose(off_diag, 0, atol=0.01)
        print("특성 직교성 테스트 통과")


class TestIntegrationWithRiceBreeding:
    """벼 육종 시나리오 통합 테스트"""

    def test_full_workflow(self):
        """전체 워크플로우 테스트"""
        print("\n" + "=" * 70)
        print("벼 육종 FAMD 통합 워크플로우 테스트")
        print("=" * 70)

        # 1. 데이터 준비 (실제 벼 육종 데이터 시뮬레이션)
        np.random.seed(42)
        n_varieties = 50

        # 양적 형질
        quantitative = np.column_stack([
            np.random.normal(600, 50, n_varieties),   # 수량 (kg/10a)
            np.random.normal(88, 5, n_varieties),     # 등숙률 (%)
            np.random.normal(95, 10, n_varieties),    # 초장 (cm)
            np.random.normal(7.5, 0.5, n_varieties)   # 단백질 (%)
        ])
        quant_names = ['수량', '등숙률', '초장', '단백질함량']

        # 질적 형질 (SNP 마커 + 저항성)
        resistance_levels = ['R', 'MR', 'MS', 'S']
        snp_alleles = ['R', 'H', 'S']

        qualitative = np.column_stack([
            np.random.choice(resistance_levels, n_varieties),  # 도열병
            np.random.choice(resistance_levels, n_varieties),  # 흰잎마름병
            np.random.choice(snp_alleles, n_varieties),        # Rf4
            np.random.choice(snp_alleles, n_varieties),        # Sub1A
            np.random.choice(['찰', '메'], n_varieties)        # 찰메성
        ])
        qual_names = ['도열병저항성', '흰잎마름병저항성', 'Rf4', 'Sub1A', '찰메성']

        variety_names = [f"품종{i+1:02d}" for i in range(n_varieties)]

        print(f"\n1. 데이터 준비 완료")
        print(f"   - 품종 수: {n_varieties}")
        print(f"   - 양적 형질: {quant_names}")
        print(f"   - 질적 형질: {qual_names}")

        # 2. FAMD 분석
        engine = FAMDEngine(balance_variables=True)

        # 특정 형질 가중치 (등숙률, 도열병저항성 강조)
        weights = {'등숙률': 1.5, '도열병저항성': 1.5}

        result = engine.fit_transform(
            quantitative, qualitative,
            quant_names=quant_names,
            qual_names=qual_names,
            n_components=5,
            weights=weights
        )

        print(f"\n2. FAMD 분석 완료")
        print(f"   - 추출 성분: {result.n_components}개")
        print(f"   - 누적 설명 분산: {result.cumulative_variance_ratio[-1]*100:.1f}%")

        # 3. 이상적 해 정의 (GA가 찾은 최적해 시뮬레이션)
        # 가장 높은 수량 + 등숙률을 가진 품종 방향
        ideal_idx = np.argmax(quantitative[:, 0] + quantitative[:, 1])
        ideal_scores = result.factor_scores[ideal_idx:ideal_idx+1, :]

        print(f"\n3. 이상적 해 설정")
        print(f"   - 기준 품종: {variety_names[ideal_idx]}")
        print(f"   - 수량: {quantitative[ideal_idx, 0]:.1f} kg/10a")
        print(f"   - 등숙률: {quantitative[ideal_idx, 1]:.1f}%")

        # 4. 부모 매칭
        # ideal_idx를 제외한 후보들
        mask = np.ones(n_varieties, dtype=bool)
        mask[ideal_idx] = False

        pool_scores = result.factor_scores[mask]
        pool_names = [n for i, n in enumerate(variety_names) if i != ideal_idx]

        closest_parents = engine.find_closest_parents(
            ideal_scores, pool_scores, pool_names,
            top_n=5,
            use_variance_weights=True,
            explained_variance_ratio=result.explained_variance_ratio
        )

        print(f"\n4. 부모 매칭 결과 (상위 5개)")
        for p in closest_parents:
            print(f"   {p['rank']}. {p['name']}: 거리={p['distance']:.4f}, 유사도={p['similarity']:.4f}")

        # 5. 상보적 부모 탐색
        parent1_scores = result.factor_scores[0, :]
        complementary = engine.find_complementary_parents(
            parent1_scores, pool_scores, pool_names,
            target_scores=ideal_scores.flatten(),
            top_n=5
        )

        print(f"\n5. 상보적 부모 탐색 ({variety_names[0]} 기준)")
        for p in complementary:
            print(f"   {p['rank']}. {p['name']}: 상보성={p['complementarity_score']:.4f}")

        # 6. ML 특성 추출
        ml_features, feature_names = engine.extract_ml_features(result, n_features=3)

        print(f"\n6. ML 특성 추출")
        print(f"   - 특성: {feature_names}")
        print(f"   - Shape: {ml_features.shape}")

        # 7. 생물학적 실현 가능성 검증
        # 임의의 잠재 공간 점 테스트
        test_point = np.mean(result.factor_scores, axis=0)  # 중심점
        is_feasible, distance = engine.is_biologically_feasible(
            test_point, result, threshold=2.5
        )

        print(f"\n7. 생물학적 실현 가능성")
        print(f"   - 중심점 테스트: {'가능' if is_feasible else '불가능'} (거리={distance:.2f})")

        print("\n" + "=" * 70)
        print("통합 워크플로우 테스트 완료!")
        print("=" * 70)

        # 검증
        assert result.n_components == 5
        assert len(closest_parents) == 5
        assert ml_features.shape == (n_varieties, 3)


# =============================================================================
# pytest 실행
# =============================================================================

if __name__ == "__main__":
    # numpy 설치 확인
    if not NUMPY_AVAILABLE:
        print("\n테스트를 실행하려면 numpy를 설치하세요:")
        print("  pip install numpy")
        sys.exit(1)

    # 직접 실행 시 모든 테스트 수행
    print("FAMD Engine 테스트 시작\n")

    # 개별 테스트 클래스 실행
    test_preprocess = TestQualitativeTraitPreprocessing()
    test_preprocess.setup_method()
    test_preprocess.test_ordinal_trait_detection()
    test_preprocess.test_nominal_trait_detection()
    test_preprocess.test_ordinal_to_numeric_conversion()
    test_preprocess.test_binary_trait_conversion()
    test_preprocess.test_one_hot_encoding()
    test_preprocess.test_preprocess_mixed_traits()

    print("\n" + "-" * 50 + "\n")

    test_core = TestFAMDCoreAlgorithm()
    test_core.setup_method()
    test_core.test_famd_basic_execution()
    test_core.test_explained_variance_sum()
    test_core.test_balance_normalization()
    test_core.test_weighted_famd()
    test_core.test_n_components_selection()

    print("\n" + "-" * 50 + "\n")

    test_matching = TestParentMatching()
    test_matching.setup_method()
    test_matching.test_calculate_distance()
    test_matching.test_find_closest_parents()
    test_matching.test_find_complementary_parents()
    test_matching.test_self_distance_is_zero()

    print("\n" + "-" * 50 + "\n")

    test_ga = TestGALatentSpace()
    test_ga.setup_method()
    test_ga.test_create_latent_space_bounds()
    test_ga.test_biological_feasibility_inside()
    test_ga.test_biological_feasibility_outside()
    test_ga.test_decode_latent_to_traits()

    print("\n" + "-" * 50 + "\n")

    test_ml = TestMLFeatureExtraction()
    test_ml.setup_method()
    test_ml.test_extract_ml_features_auto()
    test_ml.test_extract_ml_features_manual()
    test_ml.test_features_orthogonality()

    print("\n" + "-" * 50 + "\n")

    test_integration = TestIntegrationWithRiceBreeding()
    test_integration.test_full_workflow()

    print("\n모든 테스트 통과!")
