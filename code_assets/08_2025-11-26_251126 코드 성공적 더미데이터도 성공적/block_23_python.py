def evaluate_fitness_weighted(genotype, correlation_matrix, feature_importances, objectives):
    fitness = []
    for obj_idx in objectives:
        corr = correlation_matrix[obj_idx]
        imp = feature_importances[obj_idx]  # RF feature_importances_
        
        # 상관계수 × 중요도로 가중
        weighted_corr = corr * imp
        score = np.dot(genotype, weighted_corr)
        fitness.append(score)
    
    return fitness
