import numpy as np
from scipy.spatial.distance import pdist, squareform

def calculate_genetic_distance(marker_positions):
    """
    마커간 유전적 거리 계산 (Haldane/Kosambi mapping function)
    """
    # 같은 염색체 내 마커들의 물리적 거리
    distance_matrix = []
    
    for chr_num in marker_positions['Chromosome'].unique():
        chr_markers = marker_positions[marker_positions['Chromosome'] == chr_num]
        
        if len(chr_markers) > 1:
            # 물리적 거리(Mb)를 유전적 거리(cM)로 변환 (1Mb ≈ 1cM 추정)
            positions = chr_markers['Position_Mb'].values
            for i in range(len(positions)):
                for j in range(i+1, len(positions)):
                    phys_dist = abs(positions[i] - positions[j])
                    
                    # Kosambi mapping function: cM = 25 * ln((1 + 2r)/(1 - 2r))
                    # 여기서 r은 재조합 빈도
                    if phys_dist < 50:  # 50cM 이내만 연관된 것으로 간주
                        genetic_dist = phys_dist  # 단순화
                        distance_matrix.append({
                            'Gene1': chr_markers.iloc[i]['Gene'],
                            'Gene2': chr_markers.iloc[j]['Gene'],
                            'Chromosome': chr_num,
                            'Genetic_Distance_cM': genetic_dist,
                            'Linked': genetic_dist < 10  # 10cM 이내면 강한 연관
                        })
    
    return pd.DataFrame(distance_matrix)

def identify_linkage_groups(genetic_distances, threshold=10):
    """
    연관 그룹 식별 (같이 유전되는 마커 그룹)
    """
    linkage_groups = []
    linked_pairs = genetic_distances[genetic_distances['Genetic_Distance_cM'] < threshold]
    
    # 연관된 마커들을 그룹화
    from collections import defaultdict
    groups = defaultdict(set)
    
    for _, row in linked_pairs.iterrows():
        groups[row['Chromosome']].add(row['Gene1'])
        groups[row['Chromosome']].add(row['Gene2'])
    
    return dict(groups)
