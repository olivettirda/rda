def evolve(self):
    # 자손 생성
    offspring = []
    while len(offspring) < self.pop_size:
        # 토너먼트 선발, 교차, 돌연변이
        ...
    
    # 부모 + 자손 합치기 (Elitist)
    combined = self.population + offspring
    
    # 평가
    for ind in combined:
        if ind['fitness'] is None:
            ind['fitness'] = self.evaluate(ind)
    
    # 다시 정렬
    self.population = combined
    fronts = self.fast_non_dominated_sort()
    
    # 다음 세대 선택 (상위 pop_size개)
    next_population = []
    for front in fronts:
        if len(next_population) + len(front) <= self.pop_size:
            # Front 전체 추가
            for idx in front:
                next_population.append(self.population[idx])
        else:
            # Crowding Distance로 정렬해서 필요한 만큼만
            self.calculate_crowding_distance(front)
            front_sorted = sorted(front, 
                key=lambda x: self.population[x]['crowding_distance'],
                reverse=True)
            
            remaining = self.pop_size - len(next_population)
            for i in range(remaining):
                next_population.append(self.population[front_sorted[i]])
            break
    
    self.population = next_population
