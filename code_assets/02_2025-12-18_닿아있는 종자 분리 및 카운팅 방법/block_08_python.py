@dataclass
class SeparationParams:
    """종자 분리 파라미터"""
    
    # 곡률 분석
    curvature_threshold: float = 0.015      # 범위: 0.005 ~ 0.05
    curvature_smooth_sigma: float = 3.0     # 범위: 1.0 ~ 7.0
    min_peak_distance: int = 15             # 범위: 5 ~ 40
    
    # 분리점 매칭
    max_separation_distance_ratio: float = 0.35  # 범위: 0.15 ~ 0.5
    min_arc_ratio: float = 0.20             # 범위: 0.1 ~ 0.35
    max_arc_ratio: float = 0.80             # 범위: 0.65 ~ 0.9
    
    # Watershed
    watershed_threshold_ratio: float = 0.4  # 범위: 0.2 ~ 0.7
    watershed_kernel_size: int = 25         # 범위: 15 ~ 45
    
    # 분리 판단
    area_ratio_threshold: float = 1.4       # 범위: 1.2 ~ 2.0
    circularity_threshold: float = 0.65     # 범위: 0.5 ~ 0.8
