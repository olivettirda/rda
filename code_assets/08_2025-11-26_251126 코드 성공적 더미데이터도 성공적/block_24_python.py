def evaluate_fitness_constrained(genotype, models, objectives, weights, constraints):
    """
    weights: {'잎도열병 저항성': 2.0, '쌀수량': 1.5, ...}
    constraints: {'잎도열병 저항성': {'min': 0.8}}  # 필수 조건
    """
    fitness = []
    genotype_2d = np.array(genotype).reshape(1, -1)
    
    for obj_name in objectives:
        model = models[obj_name]
        prob = model.predict_proba(genotype_2d)[0][1]
        
        # 제약 조건 위반 시 페널티
        if obj_name in constraints:
            min_val = constraints[obj_name].get('min', 0)
            if prob < min_val:
                prob *= 0.1  # 페널티
        
        # 가중치 적용
        weight = weights.get(obj_name, 1.0)
        fitness.append(prob * weight)
    
    return fitness
