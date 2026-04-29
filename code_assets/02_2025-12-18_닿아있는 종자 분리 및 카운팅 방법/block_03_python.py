import numpy as np
from scipy.signal import find_peaks
from scipy.ndimage import gaussian_filter1d

class CurvatureAnalyzer:
    def __init__(self, smooth_sigma=3.0, curvature_threshold=0.015, min_peak_distance=15):
        self.smooth_sigma = smooth_sigma
        self.curvature_threshold = curvature_threshold
        self.min_peak_distance = min_peak_distance
    
    def compute_curvature(self, contour):
        """윤곽선의 각 점에서 곡률 계산"""
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        n = len(contour)
        pad = 5
        x = np.concatenate([contour[-pad:, 0], contour[:, 0], contour[:pad, 0]])
        y = np.concatenate([contour[-pad:, 1], contour[:, 1], contour[:pad, 1]])
        
        x_smooth = gaussian_filter1d(x.astype(float), self.smooth_sigma)
        y_smooth = gaussian_filter1d(y.astype(float), self.smooth_sigma)
        
        dx, dy = np.gradient(x_smooth), np.gradient(y_smooth)
        ddx, ddy = np.gradient(dx), np.gradient(dy)
        
        numerator = dx * ddy - dy * ddx
        denominator = np.maximum((dx**2 + dy**2)**1.5, 1e-10)
        curvature = numerator / denominator
        
        return curvature[pad:-pad]
    
    def find_concave_points(self, contour):
        """오목점 탐지"""
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        curvature = self.compute_curvature(contour)
        neg_curvature = -curvature  # 오목점에서 피크
        
        peaks, _ = find_peaks(
            neg_curvature,
            distance=self.min_peak_distance,
            prominence=self.curvature_threshold * 0.5,
            height=self.curvature_threshold
        )
        
        return [(idx, tuple(contour[idx]), curvature[idx]) for idx in peaks]
    
    def find_separation_pairs(self, concave_points, contour, max_distance_ratio=0.35):
        """분리선을 형성할 오목점 쌍 찾기"""
        if len(concave_points) < 2:
            return []
        
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        n = len(contour)
        perimeter = cv2.arcLength(contour.reshape(-1, 1, 2), True)
        max_distance = perimeter * max_distance_ratio
        
        pairs = []
        used = set()
        sorted_points = sorted(concave_points, key=lambda p: abs(p[2]), reverse=True)
        
        for i, p1 in enumerate(sorted_points):
            if p1[0] in used:
                continue
            
            best_pair = None
            best_score = float('inf')
            
            for j, p2 in enumerate(sorted_points):
                if i >= j or p2[0] in used:
                    continue
                
                dist = np.sqrt((p1[1][0] - p2[1][0])**2 + (p1[1][1] - p2[1][1])**2)
                if dist > max_distance or dist < 10:
                    continue
                
                arc_dist = min(abs(p1[0] - p2[0]), n - abs(p1[0] - p2[0]))
                arc_ratio = arc_dist / n
                if arc_ratio < 0.20 or arc_ratio > 0.80:
                    continue
                
                score = dist / (abs(p1[2]) + abs(p2[2]) + 0.001)
                if score < best_score:
                    best_score = score
                    best_pair = (j, p2)
            
            if best_pair:
                pairs.append((p1, best_pair[1]))
                used.add(p1[0])
                used.add(best_pair[1][0])
        
        return pairs
