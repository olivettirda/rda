@dataclass
class AwnRemovalParams:
    """까락 제거 파라미터"""
    
    enabled: bool = True
    
    # 모폴로지 기반
    erosion_iterations: int = 2             # 범위: 0 ~ 5
    dilation_iterations: int = 2            # 범위: 0 ~ 5
    kernel_size: int = 3                    # 범위: 3 ~ 7
    
    # Convex Hull 기반
    convexity_defect_threshold: float = 0.15  # 범위: 0.05 ~ 0.4
    min_defect_depth: int = 10              # 범위: 5 ~ 30
    
    # 폭 기반 필터링
    min_width_ratio: float = 0.3            # 범위: 0.1 ~ 0.5
    protrusion_length_threshold: int = 20   # 범위: 10 ~ 50
    
    # 스켈레톤 기반
    skeleton_prune_length: int = 15         # 범위: 5 ~ 40
