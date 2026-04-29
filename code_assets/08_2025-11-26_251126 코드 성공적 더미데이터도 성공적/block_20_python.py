def evaluate_fitness(genotype, correlation_matrix, objectives):
    fitness = []
    for obj_idx in objectives:
        correlations = correlation_matrix[obj_idx]  # 형질 obj_idx에 대한 유전자별 상관계수
        score = np.dot(genotype, correlations)      # 유전자형 * 상관계수의 가중합
        fitness.append(score)
    return fitness
