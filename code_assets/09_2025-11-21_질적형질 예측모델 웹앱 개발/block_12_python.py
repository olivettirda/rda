def evaluate(self, individual):
    """개체 평가"""
    genotype = individual['genotype']
    fitness = []
    
    for obj_name, weight, is_minimize in self.objectives:
        # 간단한 규칙: 유전자 보유 수 기반
        score = sum(genotype)
        
        if is_minimize:
            # 최소화: 점수가 낮을수록 좋음
            fitness.append(-score * weight)
        else:
            # 최대화: 점수가 높을수록 좋음
            fitness.append(score * weight)
    
    return fitness
