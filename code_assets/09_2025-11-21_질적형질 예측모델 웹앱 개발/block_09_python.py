def calculate_crowding_distance(self, front):
    """혼잡도 거리 계산"""
    if len(front) == 0:
        return
    
    # 초기화
    for idx in front:
        self.population[idx]['crowding_distance'] = 0
    
    n_obj = len(self.objectives)
    
    for m in range(n_obj):
        # 목표별 정렬
        front_sorted = sorted(front, 
            key=lambda x: self.population[x]['fitness'][m])
        
        # 경계 개체는 무한대
        self.population[front_sorted[0]]['crowding_distance'] = float('inf')
        self.population[front_sorted[-1]]['crowding_distance'] = float('inf')
        
        # 범위 계산
        f_min = self.population[front_sorted[0]]['fitness'][m]
        f_max = self.population[front_sorted[-1]]['fitness'][m]
        f_range = f_max - f_min
        
        if f_range == 0:
            continue
        
        # 중간 개체들
        for i in range(1, len(front_sorted) - 1):
            distance = (
                self.population[front_sorted[i+1]]['fitness'][m] - 
                self.population[front_sorted[i-1]]['fitness'][m]
            ) / f_range
            
            self.population[front_sorted[i]]['crowding_distance'] += distance
