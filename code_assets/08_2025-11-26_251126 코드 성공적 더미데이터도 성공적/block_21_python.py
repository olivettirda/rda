def evaluate_fitness(genotype, correlation_matrix, objectives):
    fitness = []
    for obj_idx in objectives:
        correlations = correlation_matrix[obj_idx]  # 형질별 유전자-표현형 상관계수
        score = np.dot(genotype, correlations)      # 유전자형 × 상관계수 선형합
        fitness.append(score)
    return fitness
