from dataclasses import dataclass
from enum import Enum
from typing import Dict, Any

class SeedType(Enum):
    ROUGH_RICE = "rough_rice"   # 정조
    BROWN_RICE = "brown_rice"   # 현미


@dataclass
class SeparationParams:
    """분리 파라미터"""
    # 곡률 분석
    curvature_threshold: float = 0.015
    curvature_smooth_sigma: float = 3.0
    min_peak_distance: int = 15
    
    # 분리점 매칭
    max_separation_distance_ratio: float = 0.35
    min_arc_ratio: float = 0.20
    max_arc_ratio: float = 0.80
    
    # Watershed
    watershed_threshold_ratio: float = 0.4
    watershed_kernel_size: int = 25
    
    # 분리 판단
    area_ratio_threshold: float = 1.4
    circularity_threshold: float = 0.65
    
    # 최소 면적
    min_seed_area: int = 500


@dataclass
class AwnRemovalParams:
    """까락 제거 파라미터"""
    enabled: bool = True
    method: str = "morphology"  # morphology, convex_hull, combined
    erosion_iterations: int = 2
    dilation_iterations: int = 2
    kernel_size: int = 3
    min_width_ratio: float = 0.3
    protrusion_length_threshold: int = 20


@dataclass 
class TextureParams:
    """텍스처 분석 파라미터 (정조용)"""
    enabled: bool = False
    edge_enhancement: bool = False
    gabor_frequency: float = 0.1
    use_clahe: bool = False  # Contrast Limited Adaptive Histogram Equalization


@dataclass
class SeedModeConfig:
    """종자 모드별 전체 설정"""
    seed_type: SeedType
    separation: SeparationParams
    awn_removal: AwnRemovalParams
    texture: TextureParams
    
    # 추가 모드별 설정
    expected_circularity_range: tuple = (0.5, 0.9)
    expected_aspect_ratio_range: tuple = (1.5, 4.0)
    color_variance_tolerance: float = 30.0


# ==================== 모드별 프리셋 ====================

ROUGH_RICE_PRESETS = {
    "default": SeedModeConfig(
        seed_type=SeedType.ROUGH_RICE,
        separation=SeparationParams(
            curvature_threshold=0.012,      # 더 민감 (불규칙한 윤곽)
            curvature_smooth_sigma=4.0,     # 더 스무딩 (거친 표면)
            min_peak_distance=12,           # 좁은 간격 허용
            max_separation_distance_ratio=0.40,  # 넓은 분리 허용
            watershed_threshold_ratio=0.35,
            area_ratio_threshold=1.3,       # 더 민감하게 분리 시도
            circularity_threshold=0.55,     # 낮은 원형도 허용
            min_seed_area=800               # 정조가 더 큼
        ),
        awn_removal=AwnRemovalParams(
            enabled=True,
            method="combined",
            erosion_iterations=3,
            dilation_iterations=3,
            kernel_size=5,
            min_width_ratio=0.25,
            protrusion_length_threshold=25
        ),
        texture=TextureParams(
            enabled=True,
            edge_enhancement=True,
            use_clahe=True
        ),
        expected_circularity_range=(0.45, 0.75),
        expected_aspect_ratio_range=(2.2, 3.8),
        color_variance_tolerance=40.0
    ),
    
    "heavy_awn": SeedModeConfig(  # 까락이 많은 품종
        seed_type=SeedType.ROUGH_RICE,
        separation=SeparationParams(
            curvature_threshold=0.010,
            curvature_smooth_sigma=5.0,
            min_peak_distance=10,
            max_separation_distance_ratio=0.45,
            watershed_threshold_ratio=0.30,
            area_ratio_threshold=1.25,
            circularity_threshold=0.50,
            min_seed_area=700
        ),
        awn_removal=AwnRemovalParams(
            enabled=True,
            method="combined",
            erosion_iterations=4,
            dilation_iterations=4,
            kernel_size=7,
            min_width_ratio=0.20,
            protrusion_length_threshold=30
        ),
        texture=TextureParams(enabled=True, edge_enhancement=True, use_clahe=True),
        expected_circularity_range=(0.40, 0.70),
        expected_aspect_ratio_range=(2.5, 4.0),
        color_variance_tolerance=50.0
    ),
    
    "no_awn": SeedModeConfig(  # 까락 없는 정조
        seed_type=SeedType.ROUGH_RICE,
        separation=SeparationParams(
            curvature_threshold=0.015,
            curvature_smooth_sigma=3.5,
            min_peak_distance=15,
            max_separation_distance_ratio=0.35,
            watershed_threshold_ratio=0.40,
            area_ratio_threshold=1.35,
            circularity_threshold=0.60,
            min_seed_area=800
        ),
        awn_removal=AwnRemovalParams(
            enabled=False,  # 까락 제거 비활성화
            method="morphology",
            erosion_iterations=1,
            dilation_iterations=1,
            kernel_size=3
        ),
        texture=TextureParams(enabled=True, edge_enhancement=False, use_clahe=True),
        expected_circularity_range=(0.55, 0.80),
        expected_aspect_ratio_range=(2.0, 3.5),
        color_variance_tolerance=35.0
    )
}


BROWN_RICE_PRESETS = {
    "default": SeedModeConfig(
        seed_type=SeedType.BROWN_RICE,
        separation=SeparationParams(
            curvature_threshold=0.018,      # 덜 민감 (매끈한 윤곽)
            curvature_smooth_sigma=2.5,     # 스무딩 적게 (이미 매끈)
            min_peak_distance=18,           # 넓은 간격
            max_separation_distance_ratio=0.30,  # 좁은 분리 거리
            watershed_threshold_ratio=0.45,
            area_ratio_threshold=1.5,       # 보수적 분리
            circularity_threshold=0.70,     # 높은 원형도 기대
            min_seed_area=400               # 현미가 더 작음
        ),
        awn_removal=AwnRemovalParams(
            enabled=False,  # 현미는 까락 없음
            method="morphology",
            erosion_iterations=0,
            dilation_iterations=0,
            kernel_size=3
        ),
        texture=TextureParams(
            enabled=False,  # 텍스처 분석 불필요
            edge_enhancement=False,
            use_clahe=False
        ),
        expected_circularity_range=(0.65, 0.90),
        expected_aspect_ratio_range=(1.8, 3.0),
        color_variance_tolerance=25.0
    ),
    
    "touching": SeedModeConfig(  # 많이 닿아있는 경우
        seed_type=SeedType.BROWN_RICE,
        separation=SeparationParams(
            curvature_threshold=0.012,
            curvature_smooth_sigma=2.0,
            min_peak_distance=12,
            max_separation_distance_ratio=0.35,
            watershed_threshold_ratio=0.35,
            area_ratio_threshold=1.3,
            circularity_threshold=0.65,
            min_seed_area=350
        ),
        awn_removal=AwnRemovalParams(enabled=False),
        texture=TextureParams(enabled=False),
        expected_circularity_range=(0.60, 0.88),
        expected_aspect_ratio_range=(1.8, 3.2),
        color_variance_tolerance=25.0
    ),
    
    "long_grain": SeedModeConfig(  # 장립종 (인디카)
        seed_type=SeedType.BROWN_RICE,
        separation=SeparationParams(
            curvature_threshold=0.015,
            curvature_smooth_sigma=2.5,
            min_peak_distance=20,
            max_separation_distance_ratio=0.35,
            watershed_threshold_ratio=0.40,
            area_ratio_threshold=1.4,
            circularity_threshold=0.55,     # 장립종은 원형도 낮음
            min_seed_area=450
        ),
        awn_removal=AwnRemovalParams(enabled=False),
        texture=TextureParams(enabled=False),
        expected_circularity_range=(0.50, 0.75),
        expected_aspect_ratio_range=(2.5, 4.0),
        color_variance_tolerance=30.0
    ),
    
    "short_grain": SeedModeConfig(  # 단립종 (자포니카)
        seed_type=SeedType.BROWN_RICE,
        separation=SeparationParams(
            curvature_threshold=0.020,
            curvature_smooth_sigma=2.5,
            min_peak_distance=15,
            max_separation_distance_ratio=0.28,
            watershed_threshold_ratio=0.50,
            area_ratio_threshold=1.6,
            circularity_threshold=0.75,     # 단립종은 원형도 높음
            min_seed_area=350
        ),
        awn_removal=AwnRemovalParams(enabled=False),
        texture=TextureParams(enabled=False),
        expected_circularity_range=(0.70, 0.92),
        expected_aspect_ratio_range=(1.5, 2.5),
        color_variance_tolerance=20.0
    )
}


def get_preset(seed_type: SeedType, preset_name: str = "default") -> SeedModeConfig:
    """프리셋 가져오기"""
    if seed_type == SeedType.ROUGH_RICE:
        return ROUGH_RICE_PRESETS.get(preset_name, ROUGH_RICE_PRESETS["default"])
    else:
        return BROWN_RICE_PRESETS.get(preset_name, BROWN_RICE_PRESETS["default"])
