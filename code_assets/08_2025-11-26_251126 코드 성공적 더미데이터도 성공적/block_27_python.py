def evaluate_fitness_ml(genotype, trained_models, objectives, fallback_correlations):
    """학습된 ML 모델의 예측 확률을 적합도로 사용"""
    fitness = []
    genotype_2d = np.array(genotype).reshape(1, -1)
    
    각 목표에 대해 모델 예측 확률을 적합도로 계산하고, 모델이 없으면 상관관계를 대안으로 사용합니다. 예측 과정에서 오류가 발생하면 대체 방법을 적용하여 유연성을 확보합니다.이제 구조를 파악했습니다. 핵심 수정 사항:

1. **모델 학습 후 Pyodide 전역 변수에 저장** (Python 객체는 JS로 전환 불가)
2. **GA에서 `predict_proba()` 직접 사용** (상관계수 대신)
3. **모델 없으면 상관계수 fallback**

코드를 수정하겠습니다.
