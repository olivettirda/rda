def determine_backcross_strategy(parent1, parent2, target_traits, marker_positions, genetic_distances):
    """
    여교배 전략 결정
    
    Parameters:
    -----------
    parent1: 우량 교배친 (recurrent parent)
    parent2: 형질 공여친 (donor parent)
    target_traits: 목표 형질 관련 마커
    marker_positions: 마커 위치 정보
    genetic_distances: 유전적 거리 정보
    
    Returns:
    --------
    strategy: 여교배 전략 딕셔너리
    """
    
    strategy = {
        'backcross_needed': False,
        'num_generations': 0,
        'marker_assisted_selection': [],
        'foreground_selection': [],  # 목표 유전자
        'background_selection': [],   # 배경 유전체 회복
        'recombination_hotspots': []
    }
    
    # 1. 목표 형질 마커와 불필요한 연관 마커 식별
    target_markers = marker_positions[marker_positions['Gene'].isin(target_traits)]
    
    # 2. Linkage drag 평가 (원하지 않는 연관 유전자)
    linkage_drag_risk = []
    for _, target in target_markers.iterrows():
        linked_markers = genetic_distances[
            (genetic_distances['Gene1'] == target['Gene']) | 
            (genetic_distances['Gene2'] == target['Gene'])
        ]
        
        if len(linked_markers) > 0:
            for _, linked in linked_markers.iterrows():
                other_gene = linked['Gene1'] if linked['Gene1'] != target['Gene'] else linked['Gene2']
                if other_gene not in target_traits:
                    linkage_drag_risk.append({
                        'Target': target['Gene'],
                        'Linked_Gene': other_gene,
                        'Distance_cM': linked['Genetic_Distance_cM'],
                        'Risk_Level': 'High' if linked['Genetic_Distance_cM'] < 5 else 'Medium'
                    })
    
    # 3. 여교배 필요성 판단
    if len(linkage_drag_risk) > 0:
        strategy['backcross_needed'] = True
        
        # 필요한 여교배 세대 수 계산
        # 일반적으로 BC3F2~BC4F2면 충분 (배경 유전체 93.75~96.88% 회복)
        max_risk = max([r['Distance_cM'] for r in linkage_drag_risk])
        if max_risk < 5:
            strategy['num_generations'] = 4  # BC4F2
        elif max_risk < 10:
            strategy['num_generations'] = 3  # BC3F2
        else:
            strategy['num_generations'] = 2  # BC2F2
    
    # 4. 마커 지원 선발 전략 (MAS)
    strategy['foreground_selection'] = target_traits
    
    # 5. 배경 선발 마커 (각 염색체당 2-3개)
    chromosomes = marker_positions['Chromosome'].unique()
    for chr in chromosomes:
        chr_markers = marker_positions[
            (marker_positions['Chromosome'] == chr) & 
            (~marker_positions['Gene'].isin(target_traits))
        ].head(2)
        strategy['background_selection'].extend(chr_markers['Gene'].tolist())
    
    # 6. 재조합 핫스팟 활용 전략
    for risk in linkage_drag_risk:
        if risk['Distance_cM'] > 2:  # 2cM 이상이면 재조합 가능
            strategy['recombination_hotspots'].append({
                'Region': f"{risk['Target']}-{risk['Linked_Gene']}",
                'Expected_Recombination_Rate': 1 - np.exp(-2 * risk['Distance_cM'] / 100)
            })
    
    return strategy, pd.DataFrame(linkage_drag_risk)

# 실제 적용 예시
def analyze_breeding_scheme(breeding_combination, marker_data):
    """
    특정 교배조합에 대한 전체 육종 계획 수립
    """
    
    # 유전적 거리 계산
    genetic_distances = calculate_genetic_distance(marker_data)
    
    # 연관 그룹 식별
    linkage_groups = identify_linkage_groups(genetic_distances)
    
    # 목표 형질 정의 (예: 도열병 저항성 + 식미)
    target_traits = ['Pb1 gene', 'Pita2 gene', 'Piz gene', 'SSIIa gene']
    
    # 여교배 전략 수립
    strategy, linkage_risks = determine_backcross_strategy(
        breeding_combination['Parent1'],
        breeding_combination['Parent2'],
        target_traits,
        marker_data,
        genetic_distances
    )
    
    return {
        'genetic_distances': genetic_distances,
        'linkage_groups': linkage_groups,
        'backcross_strategy': strategy,
        'linkage_drag_risks': linkage_risks
    }
