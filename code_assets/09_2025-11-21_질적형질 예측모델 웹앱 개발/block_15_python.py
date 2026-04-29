def evaluate(self, individual):
    genotype = individual['genotype']
    fitness = []
    
    for obj_name, weight, is_minimize in self.objectives:
        # 간단한 규칙: 유전자 보유 수 기반
        score = sum(genotype)  # ← 모든 유전자를 단순 합산!
        
        if is_minimize:
            fitness.append(-score * weight)
        else:
            fitness.append(score * weight)
    
    return fitness
