def evaluate(self, individual):
    genotype = individual['genotype']
    fitness = []
    
    for obj_name, weight, is_minimize in self.objectives:
        score = sum(genotype)  # ← 문제! 모든 유전자를 더하기만 함
        
        if is_minimize:
            fitness.append(-score * weight)
        else:
            fitness.append(score * weight)
    
    return fitness
