def fast_non_dominated_sort(self):
    """Fast Non-dominated Sorting"""
    fronts = [[]]
    
    # 각 개체의 지배 관계 계산
    for i, ind in enumerate(self.population):
        ind['domination_count'] = 0
        ind['dominated_solutions'] = []
        
        for j, other in enumerate(self.population):
            if i == j:
                continue
            
            if self.dominates(ind['fitness'], other['fitness']):
                ind['dominated_solutions'].append(j)
            elif self.dominates(other['fitness'], ind['fitness']):
                ind['domination_count'] += 1
        
        # 지배당하지 않는 개체는 Front 0
        if ind['domination_count'] == 0:
            ind['rank'] = 0
            fronts[0].append(i)
    
    # 나머지 Front 계산
    i = 0
    while len(fronts[i]) > 0:
        next_front = []
        for idx in fronts[i]:
            ind = self.population[idx]
            for j in ind['dominated_solutions']:
                dominated = self.population[j]
                dominated['domination_count'] -= 1
                if dominated['domination_count'] == 0:
                    dominated['rank'] = i + 1
                    next_front.append(j)
        if next_front:
            fronts.append(next_front)
        else:
            break
        i += 1
    
    return fronts
