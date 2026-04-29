def evaluate_fitness(genotype, ...):
    for obj_idx in objectives:
        obj_name = pheno_names[obj_idx]
        
        # 1. ML 모델 우선
        if obj_name in GA_ML_MODELS:
            model = GA_ML_MODELS[obj_name]['model']
            prob = model.predict_proba(X)[0][1]  # 클래스 1 확률
            fitness.append(prob)
        
        # 2. Fallback: 상관계수 (sigmoid 정규화)
        else:
            score = np.dot(genotype, correlations)
            score = 1 / (1 + np.exp(-score))  # 0~1 범위
            fitness.append(score)
