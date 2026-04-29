@dataclass
class SeparationParams:
    """종자 분리 파라미터"""
    
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


class ConfigurableSeparator:
    """파라미터 조정 가능한 종자 분리기"""
    
    def __init__(
        self, 
        separation_params: SeparationParams = None,
        awn_params: AwnRemovalParams = None
    ):
        self.sep_params = separation_params or SeparationParams()
        self.awn_remover = AwnRemover(awn_params)
        
        # 배경색 HSV 범위
        self.color_ranges = {
            "blue": {"lower": np.array([100, 80, 50]), "upper": np.array([130, 255, 255])},
            "green": {"lower": np.array([35, 80, 50]), "upper": np.array([85, 255, 255])},
            "white": {"lower": np.array([0, 0, 200]), "upper": np.array([180, 30, 255])},
            "black": {"lower": np.array([0, 0, 0]), "upper": np.array([180, 255, 50])}
        }
        self.background_color = "blue"
    
    def update_separation_params(self, **kwargs):
        """분리 파라미터 업데이트"""
        for key, value in kwargs.items():
            if hasattr(self.sep_params, key):
                setattr(self.sep_params, key, value)
    
    def update_awn_params(self, **kwargs):
        """까락 제거 파라미터 업데이트"""
        for key, value in kwargs.items():
            if hasattr(self.awn_remover.params, key):
                setattr(self.awn_remover.params, key, value)
    
    def preprocess(self, image: np.ndarray) -> np.ndarray:
        """전처리: 배경 제거 + 까락 제거"""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        color_range = self.color_ranges.get(self.background_color, self.color_ranges["blue"])
        
        bg_mask = cv2.inRange(hsv, color_range["lower"], color_range["upper"])
        fg_mask = cv2.bitwise_not(bg_mask)
        
        # 기본 모폴로지
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel, iterations=2)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # 까락 제거
        if self.awn_remover.params.enabled:
            fg_mask = self.awn_remover.process(fg_mask, method="combined")
        
        return fg_mask
    
    def compute_curvature(self, contour: np.ndarray) -> np.ndarray:
        """곡률 계산 (파라미터 적용)"""
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        n = len(contour)
        if n < 10:
            return np.zeros(n)
        
        pad = 5
        x = np.concatenate([contour[-pad:, 0], contour[:, 0], contour[:pad, 0]])
        y = np.concatenate([contour[-pad:, 1], contour[:, 1], contour[:pad, 1]])
        
        # 파라미터 적용: smooth_sigma
        from scipy.ndimage import gaussian_filter1d
        x_smooth = gaussian_filter1d(x.astype(float), self.sep_params.curvature_smooth_sigma)
        y_smooth = gaussian_filter1d(y.astype(float), self.sep_params.curvature_smooth_sigma)
        
        dx, dy = np.gradient(x_smooth), np.gradient(y_smooth)
        ddx, ddy = np.gradient(dx), np.gradient(dy)
        
        numerator = dx * ddy - dy * ddx
        denominator = np.maximum((dx**2 + dy**2)**1.5, 1e-10)
        curvature = numerator / denominator
        
        return curvature[pad:-pad]
    
    def find_concave_points(self, contour: np.ndarray) -> List[Tuple[int, Tuple[int, int], float]]:
        """오목점 탐지 (파라미터 적용)"""
        from scipy.signal import find_peaks
        
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        curvature = self.compute_curvature(contour)
        if len(curvature) < 10:
            return []
        
        neg_curvature = -curvature
        
        # 파라미터 적용: curvature_threshold, min_peak_distance
        peaks, _ = find_peaks(
            neg_curvature,
            distance=self.sep_params.min_peak_distance,
            prominence=self.sep_params.curvature_threshold * 0.5,
            height=self.sep_params.curvature_threshold
        )
        
        return [(idx, tuple(contour[idx]), curvature[idx]) for idx in peaks if 0 <= idx < len(contour)]
    
    def find_separation_pairs(
        self, 
        concave_points: List, 
        contour: np.ndarray
    ) -> List[Tuple]:
        """분리점 쌍 찾기 (파라미터 적용)"""
        if len(concave_points) < 2:
            return []
        
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        n = len(contour)
        perimeter = cv2.arcLength(contour.reshape(-1, 1, 2), True)
        
        # 파라미터 적용: max_separation_distance_ratio
        max_distance = perimeter * self.sep_params.max_separation_distance_ratio
        
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
                
                # 파라미터 적용: min_arc_ratio, max_arc_ratio
                if arc_ratio < self.sep_params.min_arc_ratio or arc_ratio > self.sep_params.max_arc_ratio:
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
    
    def apply_watershed(self, image: np.ndarray, mask: np.ndarray) -> np.ndarray:
        """Watershed 적용 (파라미터 적용)"""
        from scipy.ndimage import maximum_filter, label
        
        dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        
        # 파라미터 적용: watershed_kernel_size, watershed_threshold_ratio
        local_max = maximum_filter(dist, size=self.sep_params.watershed_kernel_size)
        threshold = dist.max() * self.sep_params.watershed_threshold_ratio
        seeds = (dist == local_max) & (dist > threshold)
        
        markers, num_seeds = label(seeds)
        
        if num_seeds == 0:
            markers[mask > 0] = 1
            return markers
        
        kernel = np.ones((3, 3), np.uint8)
        sure_bg = cv2.dilate(mask, kernel, iterations=3)
        markers = markers + 1
        markers[sure_bg == 0] = 1
        markers[(mask > 0) & (markers == 1)] = 0
        
        markers = markers.astype(np.int32)
        cv2.watershed(image, markers)
        
        markers[markers <= 1] = 0
        markers = markers - 1
        markers[markers < 0] = 0
        
        return markers
    
    def needs_separation(self, contour: np.ndarray, single_seed_area: float) -> bool:
        """분리 필요 여부 판단 (파라미터 적용)"""
        area = cv2.contourArea(contour)
        
        # 파라미터 적용: area_ratio_threshold
        if area > single_seed_area * self.sep_params.area_ratio_threshold:
            return True
        
        perimeter = cv2.arcLength(contour, True)
        circularity = (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0
        
        # 파라미터 적용: circularity_threshold
        if circularity < self.sep_params.circularity_threshold:
            return True
        
        return False
    
    def process(self, image: np.ndarray) -> Tuple[List[dict], np.ndarray]:
        """전체 처리 파이프라인"""
        # 전처리
        binary_mask = self.preprocess(image)
        
        # 단일 종자 면적 추정
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        areas = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > self.sep_params.min_seed_area]
        
        if not areas:
            return [], np.zeros(binary_mask.shape, dtype=np.int32)
        
        median_area = np.median(areas)
        filtered = [a for a in areas if median_area * 0.5 < a < median_area * 1.5]
        single_seed_area = np.mean(filtered) if filtered else median_area
        
        # 윤곽선 검출
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        result_labels = np.zeros(binary_mask.shape, dtype=np.int32)
        current_label = 1
        all_seeds = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < self.sep_params.min_seed_area:
                continue
            
            # 까락 제거된 윤곽선
            if self.awn_remover.params.enabled:
                contour = self.awn_remover.process_contour(contour, image.shape)
            
            individual_mask = np.zeros(binary_mask.shape, dtype=np.uint8)
            cv2.drawContours(individual_mask, [contour], -1, 255, -1)
            
            if self.needs_separation(contour, single_seed_area):
                # 곡률 분석
                concave_points = self.find_concave_points(contour)
                separation_pairs = self.find_separation_pairs(concave_points, contour)
                
                # 분리선 적용
                if separation_pairs:
                    temp_mask = individual_mask.copy()
                    for p1, p2 in separation_pairs:
                        cv2.line(temp_mask, p1[1], p2[1], 0, 2)
                    sub_labels = self.apply_watershed(image, temp_mask)
                else:
                    sub_labels = self.apply_watershed(image, individual_mask)
                
                # 라벨 병합
                for label_val in np.unique(sub_labels):
                    if label_val == 0:
                        continue
                    sub_mask = (sub_labels == label_val).astype(np.uint8) * 255
                    sub_contours, _ = cv2.findContours(sub_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                    if sub_contours:
                        sub_contour = max(sub_contours, key=cv2.contourArea)
                        if cv2.contourArea(sub_contour) >= self.sep_params.min_seed_area * 0.5:
                            result_labels[sub_labels == label_val] = current_label
                            all_seeds.append(self._measure(sub_contour, current_label))
                            current_label += 1
            else:
                result_labels[individual_mask > 0] = current_label
                all_seeds.append(self._measure(contour, current_label))
                current_label += 1
        
        return all_seeds, result_labels
    
    def _measure(self, contour: np.ndarray, seed_id: int) -> dict:
        """종자 측정"""
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        M = cv2.moments(contour)
        cx = int(M["m10"] / M["m00"]) if M["m00"] != 0 else 0
        cy = int(M["m01"] / M["m00"]) if M["m00"] != 0 else 0
        
        if len(contour) >= 5:
            (_, (minor, major), angle) = cv2.fitEllipse(contour)
        else:
            major = minor = angle = 0
        
        return {
            "id": seed_id,
            "centroid": (cx, cy),
            "area": area,
            "perimeter": perimeter,
            "major_axis": major,
            "minor_axis": minor,
            "aspect_ratio": major / minor if minor > 0 else 0,
            "circularity": (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0,
            "angle": angle,
            "contour": contour
        }
