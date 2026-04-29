def evaluate_fitness_ml(genotype, trained_models, objectives):
    """학습된 ML 모델의 예측 확률을 직접 적합도로 사용"""
    fitness = []
    genotype_2d = np.array(genotype).reshape(1, -1)
    
    for obj_name in objectives:
        model = trained_models[obj_name]
        # 클래스 1(보유)일 확률을 적합도로
        prob = model.predict_proba(genotype_2d)[0][1]
        fitness.append(prob)
    
    return fitness
