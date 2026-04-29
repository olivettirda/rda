import cv2
import numpy as np
from scipy.ndimage import distance_transform_edt
from skimage.morphology import skeletonize, remove_small_objects
from dataclasses import dataclass
from typing import Tuple, List, Optional

@dataclass
class AwnRemovalParams:
    """까락 제거 파라미터"""
    enabled: bool = True
    
    # 모폴로지 기반
    erosion_iterations: int = 2
    dilation_iterations: int = 2
    kernel_size: int = 3
    
    # Convex Hull 기반
    convexity_defect_threshold: float = 0.15
    min_defect_depth: int = 10
    
    # 폭 기반 필터링
    min_width_ratio: float = 0.3
    protrusion_length_threshold: int = 20
    
    # 스켈레톤 기반
    skeleton_prune_length: int = 15


class AwnRemover:
    """까락(Awn) 제거 클래스"""
    
    def __init__(self, params: AwnRemovalParams = None):
        self.params = params or AwnRemovalParams()
    
    def remove_awn_morphology(self, mask: np.ndarray) -> np.ndarray:
        """
        모폴로지 연산 기반 까락 제거
        Opening = Erosion → Dilation
        좁은 돌출부가 erosion에서 사라지고 dilation에서 복원되지 않음
        """
        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE, 
            (self.params.kernel_size, self.params.kernel_size)
        )
        
        # Erosion: 까락 같은 얇은 부분 제거
        eroded = cv2.erode(
            mask, kernel, 
            iterations=self.params.erosion_iterations
        )
        
        # Dilation: 본체 복원 (까락은 이미 사라짐)
        opened = cv2.dilate(
            eroded, kernel, 
            iterations=self.params.dilation_iterations
        )
        
        return opened
    
    def remove_awn_convex_hull(self, mask: np.ndarray) -> np.ndarray:
        """
        Convex Hull 기반 까락 제거
        Convex Hull과 실제 윤곽선의 차이(defect)를 분석하여
        깊이가 얕은 돌출부를 제거
        """
        result = mask.copy()
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        for contour in contours:
            if len(contour) < 5:
                continue
            
            # Convex Hull
            hull = cv2.convexHull(contour, returnPoints=False)
            
            try:
                defects = cv2.convexityDefects(contour, hull)
            except:
                continue
            
            if defects is None:
                continue
            
            # 면적 기준
            area = cv2.contourArea(contour)
            hull_area = cv2.contourArea(cv2.convexHull(contour))
            solidity = area / hull_area if hull_area > 0 else 1.0
            
            # Solidity가 높으면 (볼록에 가까우면) 까락 적음
            if solidity > (1 - self.params.convexity_defect_threshold):
                continue
            
            # 깊이가 얕은 defect 영역을 Convex Hull로 채우기
            defect_points = []
            for i in range(defects.shape[0]):
                s, e, f, d = defects[i, 0]
                depth = d / 256.0  # 실제 픽셀 거리
                
                if depth < self.params.min_defect_depth:
                    # 얕은 defect = 까락 후보
                    # start ~ end 사이의 점들을 수집
                    if s < e:
                        pts = contour[s:e+1]
                    else:
                        pts = np.vstack([contour[s:], contour[:e+1]])
                    defect_points.extend(pts.reshape(-1, 2).tolist())
            
            # 얕은 defect 영역을 hull로 대체
            if defect_points:
                hull_contour = cv2.convexHull(contour)
                cv2.drawContours(result, [hull_contour], -1, 255, -1)
        
        return result
    
    def remove_awn_width_based(self, mask: np.ndarray) -> np.ndarray:
        """
        폭 기반 까락 제거
        Distance Transform을 사용하여 각 점에서의 '폭'을 계산
        폭이 좁은 돌출부를 제거
        """
        # Distance Transform
        dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        
        # 평균 폭 계산
        mean_width = np.mean(dist[dist > 0]) if np.any(dist > 0) else 1
        
        # 폭 임계값
        width_threshold = mean_width * self.params.min_width_ratio
        
        # 폭이 좁은 영역 마스크
        narrow_mask = (dist > 0) & (dist < width_threshold)
        
        # 좁은 영역 중 돌출부만 제거 (연결 분석)
        result = mask.copy()
        
        # 좁은 영역의 연결 요소 분석
        narrow_uint8 = narrow_mask.astype(np.uint8) * 255
        contours, _ = cv2.findContours(narrow_uint8, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for cnt in contours:
            # 돌출부 길이 체크
            rect = cv2.minAreaRect(cnt)
            width, height = rect[1]
            length = max(width, height)
            
            if length > self.params.protrusion_length_threshold:
                # 긴 돌출부 = 까락
                cv2.drawContours(result, [cnt], -1, 0, -1)
        
        return result
    
    def remove_awn_skeleton(self, mask: np.ndarray) -> np.ndarray:
        """
        스켈레톤 기반 까락 제거
        스켈레톤의 끝점에서 짧은 가지를 가지치기(pruning)
        """
        # 스켈레톤 추출
        skeleton = skeletonize(mask > 0)
        
        # 끝점 찾기 (이웃이 1개인 점)
        kernel = np.array([[1, 1, 1], [1, 10, 1], [1, 1, 1]], dtype=np.uint8)
        neighbor_count = cv2.filter2D(skeleton.astype(np.uint8), -1, kernel)
        
        # 끝점: 본인(10) + 이웃(1) = 11
        endpoints = (neighbor_count == 11) & skeleton
        
        # 각 끝점에서 가지 길이 계산 및 짧은 가지 제거
        pruned_skeleton = skeleton.copy()
        endpoint_coords = np.argwhere(endpoints)
        
        for y, x in endpoint_coords:
            branch_length = self._trace_branch_length(skeleton, x, y)
            if branch_length < self.params.skeleton_prune_length:
                # 짧은 가지 제거
                self._remove_branch(pruned_skeleton, x, y, self.params.skeleton_prune_length)
        
        # 스켈레톤을 다시 마스크로 복원 (Distance Transform 역변환)
        dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        
        # 가지치기된 스켈레톤 기준으로 마스크 재구성
        result = np.zeros_like(mask)
        skeleton_coords = np.argwhere(pruned_skeleton)
        
        for y, x in skeleton_coords:
            radius = int(dist[y, x])
            if radius > 0:
                cv2.circle(result, (x, y), radius, 255, -1)
        
        return result
    
    def _trace_branch_length(self, skeleton: np.ndarray, x: int, y: int) -> int:
        """끝점에서 분기점까지의 거리 추적"""
        length = 0
        visited = set()
        h, w = skeleton.shape
        
        while True:
            visited.add((x, y))
            length += 1
            
            # 이웃 탐색
            neighbors = []
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if skeleton[ny, nx] and (nx, ny) not in visited:
                            neighbors.append((nx, ny))
            
            if len(neighbors) == 0:
                # 막다른 길
                break
            elif len(neighbors) == 1:
                # 계속 추적
                x, y = neighbors[0]
            else:
                # 분기점 도달
                break
            
            if length > 100:  # 안전장치
                break
        
        return length
    
    def _remove_branch(self, skeleton: np.ndarray, x: int, y: int, max_length: int):
        """끝점에서 시작하여 짧은 가지 제거"""
        removed = 0
        h, w = skeleton.shape
        
        while removed < max_length:
            skeleton[y, x] = False
            removed += 1
            
            # 이웃 탐색
            neighbors = []
            for dx in [-1, 0, 1]:
                for dy in [-1, 0, 1]:
                    if dx == 0 and dy == 0:
                        continue
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        if skeleton[ny, nx]:
                            neighbors.append((nx, ny))
            
            if len(neighbors) == 1:
                x, y = neighbors[0]
            else:
                break
    
    def process(self, mask: np.ndarray, method: str = "morphology") -> np.ndarray:
        """
        까락 제거 메인 함수
        
        Args:
            mask: 이진 마스크
            method: 제거 방법
                - "morphology": 모폴로지 기반 (빠름, 기본)
                - "convex_hull": Convex Hull 기반
                - "width": 폭 기반
                - "skeleton": 스켈레톤 기반 (정교함)
                - "combined": 모든 방법 조합
        """
        if not self.params.enabled:
            return mask
        
        if method == "morphology":
            return self.remove_awn_morphology(mask)
        elif method == "convex_hull":
            return self.remove_awn_convex_hull(mask)
        elif method == "width":
            return self.remove_awn_width_based(mask)
        elif method == "skeleton":
            return self.remove_awn_skeleton(mask)
        elif method == "combined":
            # 단계적 적용
            result = self.remove_awn_morphology(mask)
            result = self.remove_awn_convex_hull(result)
            return result
        else:
            return mask
    
    def process_contour(self, contour: np.ndarray, image_shape: Tuple[int, int]) -> np.ndarray:
        """
        개별 윤곽선에서 까락 제거
        
        Returns:
            까락이 제거된 윤곽선
        """
        # 윤곽선을 마스크로 변환
        mask = np.zeros(image_shape[:2], dtype=np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, -1)
        
        # 까락 제거
        cleaned_mask = self.process(mask, method="combined")
        
        # 마스크를 다시 윤곽선으로
        contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        if contours:
            return max(contours, key=cv2.contourArea)
        return contour
