from fastapi import FastAPI, UploadFile, File, Query
from enum import Enum
import cv2
import numpy as np
import base64

app = FastAPI(title="Seed Counter API - Mode Aware")

class SeedTypeEnum(str, Enum):
    rough_rice = "rough_rice"
    brown_rice = "brown_rice"

class PresetEnum(str, Enum):
    default = "default"
    heavy_awn = "heavy_awn"
    no_awn = "no_awn"
    touching = "touching"
    long_grain = "long_grain"
    short_grain = "short_grain"

separator = ModeAwareSeparator()


@app.post("/api/v1/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    seed_type: SeedTypeEnum = Query(SeedTypeEnum.brown_rice, description="종자 타입"),
    preset: str = Query("default", description="프리셋"),
    background_color: str = Query("blue", description="배경색"),
    # 커스텀 파라미터 (선택적 오버라이드)
    curvature_threshold: float = Query(None, ge=0.005, le=0.05),
    min_seed_area: int = Query(None, ge=100, le=5000),
    awn_enabled: bool = Query(None),
    awn_erosion: int = Query(None, ge=0, le=5)
):
    """
    종자 이미지 분석 (모드 선택 가능)
    
    - **seed_type**: rough_rice(정조) 또는 brown_rice(현미)
    - **preset**: 프리셋 선택
      - 정조: default, heavy_awn, no_awn
      - 현미: default, touching, long_grain, short_grain
    """
    # 모드 설정
    seed_type_enum = SeedType.ROUGH_RICE if seed_type == "rough_rice" else SeedType.BROWN_RICE
    separator.set_mode(seed_type_enum, preset)
    separator.preprocessor.background_color = background_color
    
    # 커스텀 파라미터 오버라이드
    if curvature_threshold is not None:
        separator.config.separation.curvature_threshold = curvature_threshold
    if min_seed_area is not None:
        separator.config.separation.min_seed_area = min_seed_area
    if awn_enabled is not None:
        separator.config.awn_removal.enabled = awn_enabled
    if awn_erosion is not None:
        separator.config.awn_removal.erosion_iterations = awn_erosion
        separator.config.awn_removal.dilation_iterations = awn_erosion
    
    # 이미지 로드
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 분석
    seeds, labels = separator.process(image)
    
    # 시각화
    vis = visualize(image, seeds, seed_type_enum)
    _, buffer = cv2.imencode('.png', vis)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "total_count": len(seeds),
        "seed_type": seed_type,
        "preset": preset,
        "seeds": [{k: v for k, v in s.items() if k != "contour"} for s in seeds],
        "visualization": f"data:image/png;base64,{img_base64}",
        "config_used": {
            "curvature_threshold": separator.config.separation.curvature_threshold,
            "min_seed_area": separator.config.separation.min_seed_area,
            "awn_enabled": separator.config.awn_removal.enabled,
            "circularity_threshold": separator.config.separation.circularity_threshold
        }
    }


@app.get("/api/v1/presets")
async def get_presets():
    """사용 가능한 프리셋 목록"""
    return {
        "rough_rice": {
            "default": "기본 정조 설정",
            "heavy_awn": "까락이 많은 품종",
            "no_awn": "까락 없는 정조"
        },
        "brown_rice": {
            "default": "기본 현미 설정",
            "touching": "밀접하게 닿은 종자",
            "long_grain": "장립종 (인디카)",
            "short_grain": "단립종 (자포니카)"
        }
    }


def visualize(image, seeds, seed_type):
    """시각화 (모드별 색상)"""
    vis = image.copy()
    np.random.seed(42)
    
    # 모드별 색상 톤
    if seed_type == SeedType.ROUGH_RICE:
        base_colors = np.random.randint(100, 200, (len(seeds) + 1, 3))  # 따뜻한 톤
        base_colors[:, 0] = np.clip(base_colors[:, 0] + 50, 0, 255)  # 빨강 강조
    else:
        base_colors = np.random.randint(50, 255, (len(seeds) + 1, 3))  # 일반
    
    colors = [tuple(map(int, c)) for c in base_colors]
    
    overlay = image.copy()
    for seed in seeds:
        cv2.drawContours(overlay, [seed["contour"]], -1, colors[seed["id"] % len(colors)], -1)
    cv2.addWeighted(overlay, 0.35, vis, 0.65, 0, vis)
    
    for seed in seeds:
        cv2.drawContours(vis, [seed["contour"]], -1, (0, 255, 0), 2)
        cx, cy = seed["centroid"]
        cv2.putText(vis, str(seed["id"]), (cx-5, cy+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
        cv2.putText(vis, str(seed["id"]), (cx-5, cy+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 1)
    
    # 모드 표시
    mode_text = "정조 (Rough Rice)" if seed_type == SeedType.ROUGH_RICE else "현미 (Brown Rice)"
    cv2.putText(vis, f"{mode_text} | Count: {len(seeds)}", (10, 30), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
    
    return vis
