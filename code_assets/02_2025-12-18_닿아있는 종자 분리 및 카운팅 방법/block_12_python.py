from fastapi import FastAPI, UploadFile, File, Query
from pydantic import BaseModel, Field
from typing import Optional
import cv2
import numpy as np
import base64

app = FastAPI(title="Seed Counter API with Configurable Parameters")

# 전역 분리기
separator = ConfigurableSeparator()


class SeparationConfig(BaseModel):
    """분리 설정 모델"""
    # 곡률 분석
    curvature_threshold: float = Field(0.015, ge=0.005, le=0.05, description="곡률 임계값")
    curvature_smooth_sigma: float = Field(3.0, ge=1.0, le=7.0, description="스무딩 강도")
    min_peak_distance: int = Field(15, ge=5, le=40, description="피크 간 최소 거리")
    
    # 분리점 매칭
    max_separation_distance_ratio: float = Field(0.35, ge=0.15, le=0.5, description="분리점 최대 거리 비율")
    min_arc_ratio: float = Field(0.20, ge=0.1, le=0.35, description="최소 호 비율")
    max_arc_ratio: float = Field(0.80, ge=0.65, le=0.9, description="최대 호 비율")
    
    # Watershed
    watershed_threshold_ratio: float = Field(0.4, ge=0.2, le=0.7, description="Watershed 임계값 비율")
    
    # 분리 판단
    area_ratio_threshold: float = Field(1.4, ge=1.2, le=2.0, description="면적 비율 임계값")
    circularity_threshold: float = Field(0.65, ge=0.5, le=0.8, description="원형도 임계값")
    
    # 최소 면적
    min_seed_area: int = Field(500, ge=100, le=5000, description="최소 종자 면적")


class AwnConfig(BaseModel):
    """까락 제거 설정 모델"""
    enabled: bool = Field(True, description="까락 제거 활성화")
    erosion_iterations: int = Field(2, ge=0, le=5, description="침식 반복 횟수")
    dilation_iterations: int = Field(2, ge=0, le=5, description="팽창 반복 횟수")
    kernel_size: int = Field(3, ge=3, le=7, description="커널 크기 (홀수)")
    min_width_ratio: float = Field(0.3, ge=0.1, le=0.5, description="최소 폭 비율")
    protrusion_length_threshold: int = Field(20, ge=10, le=50, description="돌출부 길이 임계값")


class FullConfig(BaseModel):
    """전체 설정"""
    separation: SeparationConfig = SeparationConfig()
    awn: AwnConfig = AwnConfig()
    background_color: str = Field("blue", description="배경색 (blue/white/black)")


@app.post("/api/v1/analyze")
async def analyze_image(
    file: UploadFile = File(...),
    # 분리 파라미터
    curvature_threshold: float = Query(0.015, ge=0.005, le=0.05),
    curvature_smooth_sigma: float = Query(3.0, ge=1.0, le=7.0),
    min_peak_distance: int = Query(15, ge=5, le=40),
    max_separation_distance_ratio: float = Query(0.35, ge=0.15, le=0.5),
    watershed_threshold_ratio: float = Query(0.4, ge=0.2, le=0.7),
    area_ratio_threshold: float = Query(1.4, ge=1.2, le=2.0),
    circularity_threshold: float = Query(0.65, ge=0.5, le=0.8),
    min_seed_area: int = Query(500, ge=100, le=5000),
    # 까락 제거 파라미터
    awn_enabled: bool = Query(True),
    awn_erosion: int = Query(2, ge=0, le=5),
    awn_dilation: int = Query(2, ge=0, le=5),
    awn_kernel_size: int = Query(3, ge=3, le=7),
    # 기타
    background_color: str = Query("blue")
):
    """
    종자 이미지 분석 API (파라미터 조정 가능)
    """
    # 파라미터 업데이트
    separator.update_separation_params(
        curvature_threshold=curvature_threshold,
        curvature_smooth_sigma=curvature_smooth_sigma,
        min_peak_distance=min_peak_distance,
        max_separation_distance_ratio=max_separation_distance_ratio,
        watershed_threshold_ratio=watershed_threshold_ratio,
        area_ratio_threshold=area_ratio_threshold,
        circularity_threshold=circularity_threshold,
        min_seed_area=min_seed_area
    )
    
    separator.update_awn_params(
        enabled=awn_enabled,
        erosion_iterations=awn_erosion,
        dilation_iterations=awn_dilation,
        kernel_size=awn_kernel_size
    )
    
    separator.background_color = background_color
    
    # 이미지 로드
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # 분석
    seeds, labels = separator.process(image)
    
    # 시각화
    vis = visualize(image, seeds)
    _, buffer = cv2.imencode('.png', vis)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "total_count": len(seeds),
        "seeds": [{k: v for k, v in s.items() if k != "contour"} for s in seeds],
        "visualization": f"data:image/png;base64,{img_base64}",
        "params_used": {
            "separation": {
                "curvature_threshold": curvature_threshold,
                "watershed_threshold_ratio": watershed_threshold_ratio,
                "area_ratio_threshold": area_ratio_threshold,
                "min_seed_area": min_seed_area
            },
            "awn": {
                "enabled": awn_enabled,
                "erosion": awn_erosion,
                "dilation": awn_dilation
            }
        }
    }


@app.post("/api/v1/analyze/batch")
async def analyze_with_config(file: UploadFile = File(...), config: FullConfig = None):
    """JSON Body로 전체 설정 전달"""
    if config is None:
        config = FullConfig()
    
    # 설정 적용
    separator.update_separation_params(**config.separation.dict())
    separator.update_awn_params(**config.awn.dict())
    separator.background_color = config.background_color
    
    # 분석 진행
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    seeds, labels = separator.process(image)
    
    vis = visualize(image, seeds)
    _, buffer = cv2.imencode('.png', vis)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    return {
        "total_count": len(seeds),
        "seeds": [{k: v for k, v in s.items() if k != "contour"} for s in seeds],
        "visualization": f"data:image/png;base64,{img_base64}"
    }


def visualize(image, seeds):
    """결과 시각화"""
    vis = image.copy()
    np.random.seed(42)
    colors = [tuple(map(int, c)) for c in np.random.randint(50, 255, (len(seeds) + 1, 3))]
    
    overlay = image.copy()
    for seed in seeds:
        cv2.drawContours(overlay, [seed["contour"]], -1, colors[seed["id"] % len(colors)], -1)
    cv2.addWeighted(overlay, 0.35, vis, 0.65, 0, vis)
    
    for seed in seeds:
        cv2.drawContours(vis, [seed["contour"]], -1, (0, 255, 0), 2)
        cx, cy = seed["centroid"]
        cv2.putText(vis, str(seed["id"]), (cx-5, cy+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 2)
        cv2.putText(vis, str(seed["id"]), (cx-5, cy+5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,0,0), 1)
    
    cv2.putText(vis, f"Count: {len(seeds)}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 255, 0), 2)
    return vis
