import pandas as pd

def create_marker_position_template_from_blast():
    """
    BLAST 결과로부터 마커 위치 템플릿 생성
    """
    
    # KASP 마커 예시 (실제로 알려진 위치들)
    known_markers = pd.DataFrame({
        'Gene': ['Pb1', 'Pita2', 'Piz', 'Pi-k', 'SSIIa', 'Waxy', 'ALK'],
        'Chromosome': [11, 12, 6, 11, 6, 6, 6],
        'Physical_Position_Mb': [
            21.8,  # Pb1 - 실제 위치 근처
            10.3,  # Pita2 - 실제 위치 근처  
            8.1,   # Piz - 실제 위치 근처
            27.5,  # Pi-k - 실제 위치 근처
            4.2,   # SSIIa - 실제 위치 근처
            1.8,   # Waxy - 실제 위치 근처
            4.7    # ALK - 실제 위치 근처
        ],
        'Notes': [
            'Blast resistance',
            'Blast resistance',
            'Blast resistance', 
            'Blast resistance',
            'Starch synthesis',
            'Amylose content',
            'Gelatinization temp'
        ]
    })
    
    # 유전적 거리 자동 계산
    known_markers['Estimated_Genetic_Position_cM'] = known_markers.apply(
        lambda row: estimate_genetic_distance_from_physical(
            row['Physical_Position_Mb'], 
            row['Chromosome']
        ), axis=1
    ).round(1)
    
    return known_markers

# 실행
marker_positions = create_marker_position_template_from_blast()
print(marker_positions)
