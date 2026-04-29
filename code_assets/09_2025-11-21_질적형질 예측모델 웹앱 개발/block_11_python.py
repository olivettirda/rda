def crowded_comparison(self, idx1, idx2):
    """혼잡도 비교"""
    ind1 = self.population[idx1]
    ind2 = self.population[idx2]
    
    # Rank가 낮은 것이 우선
    if ind1['rank'] < ind2['rank']:
        return True
    elif ind1['rank'] > ind2['rank']:
        return False
    else:
        # 같은 Rank면 Crowding Distance가 큰 것이 우선
        return ind1['crowding_distance'] > ind2['crowding_distance']
