def quick_backcross_decision(target_gene, linked_genes_within_20mb):
    """
    물리적 거리만으로 여교배 필요성 빠른 판단
    
    Rules of thumb:
    - 같은 염색체 5 Mb 이내: 강한 연관 (BC4 필요)
    - 5-10 Mb: 중간 연관 (BC3 필요)  
    - 10-20 Mb: 약한 연관 (BC2 또는 큰 집단)
    - 20 Mb 이상: 독립 분리 가능
    """
    
    decision = {
        'target': target_gene,
        'backcross_needed': False,
        'bc_generations': 0,
        'population_size': 200
    }
    
    if len(linked_genes_within_20mb) == 0:
        decision['strategy'] = 'Direct selection 가능'
        decision['population_size'] = 200
        
    elif min(linked_genes_within_20mb) < 5:
        decision['backcross_needed'] = True
        decision['bc_generations'] = 4
        decision['strategy'] = 'BC4F2 권장 (강한 연관)'
        decision['population_size'] = 100
        
    elif min(linked_genes_within_20mb) < 10:
        decision['backcross_needed'] = True
        decision['bc_generations'] = 3
        decision['strategy'] = 'BC3F2 권장 (중간 연관)'
        decision['population_size'] = 150
        
    else:
        decision['strategy'] = 'Large population으로 해결 가능'
        decision['population_size'] = 500
    
    return decision

# 예시
result = quick_backcross_decision('Pb1', [3.5, 7.2, 15.8])  # Mb 단위 거리
print(result)
