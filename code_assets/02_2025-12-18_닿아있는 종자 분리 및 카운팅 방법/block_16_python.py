class ModeAwareSeparator:
    """모드별 종자 분리기"""
    
    def __init__(self, config: SeedModeConfig = None):
        self.config = config or get_preset(SeedType.BROWN_RICE)
        self.preprocessor = ModeAwarePreprocessor(self.config)
        self.awn_remover = AwnRemover(self.config.awn_removal)
    
    def set_mode(self, seed_type: SeedType, preset_name: str = "default"):
        """모드 변경"""
        self.config = get_preset(seed_type, preset_name)
        self.preprocessor = ModeAwarePreprocessor(self.config)
        self.awn_remover = AwnRemover(self.config.awn_removal)
    
    def validate_seed(self, seed_info: dict) -> bool:
        """종자 유효성 검증 (모드별 기준)"""
        circularity = seed_info["circularity"]
        aspect_ratio = seed_info["aspect_ratio"]
        
        circ_min, circ_max = self.config.expected_circularity_range
        ar_min, ar_max = self.config.expected_aspect_ratio_range
        
        if not (circ_min <= circularity <= circ_max):
            return False
        if not (ar_min <= aspect_ratio <= ar_max):
            return False
        
        return True
    
    def compute_curvature(self, contour: np.ndarray) -> np.ndarray:
        """곡률 계산"""
        from scipy.ndimage import gaussian_filter1d
        
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        n = len(contour)
        if n < 10:
            return np.zeros(n)
        
        pad = 5
        x = np.concatenate([contour[-pad:, 0], contour[:, 0], contour[:pad, 0]])
        y = np.concatenate([contour[-pad:, 1], contour[:, 1], contour[:pad, 1]])
        
        sigma = self.config.separation.curvature_smooth_sigma
        x_smooth = gaussian_filter1d(x.astype(float), sigma)
        y_smooth = gaussian_filter1d(y.astype(float), sigma)
        
        dx, dy = np.gradient(x_smooth), np.gradient(y_smooth)
        ddx, ddy = np.gradient(dx), np.gradient(dy)
        
        numerator = dx * ddy - dy * ddx
        denominator = np.maximum((dx**2 + dy**2)**1.5, 1e-10)
        curvature = numerator / denominator
        
        return curvature[pad:-pad]
    
    def find_concave_points(self, contour: np.ndarray) -> list:
        """오목점 탐지"""
        from scipy.signal import find_peaks
        
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        curvature = self.compute_curvature(contour)
        if len(curvature) < 10:
            return []
        
        neg_curvature = -curvature
        
        params = self.config.separation
        peaks, _ = find_peaks(
            neg_curvature,
            distance=params.min_peak_distance,
            prominence=params.curvature_threshold * 0.5,
            height=params.curvature_threshold
        )
        
        return [(idx, tuple(contour[idx]), curvature[idx]) for idx in peaks if 0 <= idx < len(contour)]
    
    def find_separation_pairs(self, concave_points: list, contour: np.ndarray) -> list:
        """분리점 쌍 찾기"""
        if len(concave_points) < 2:
            return []
        
        if contour.ndim == 3:
            contour = contour.squeeze()
        
        n = len(contour)
        perimeter = cv2.arcLength(contour.reshape(-1, 1, 2), True)
        
        params = self.config.separation
        max_distance = perimeter * params.max_separation_distance_ratio
        
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
                
                if arc_ratio < params.min_arc_ratio or arc_ratio > params.max_arc_ratio:
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
        """Watershed 적용"""
        from scipy.ndimage import maximum_filter, label
        
        dist = cv2.distanceTransform(mask, cv2.DIST_L2, 5)
        
        params = self.config.separation
        local_max = maximum_filter(dist, size=params.watershed_kernel_size)
        threshold = dist.max() * params.watershed_threshold_ratio
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
        """분리 필요 여부"""
        area = cv2.contourArea(contour)
        params = self.config.separation
        
        if area > single_seed_area * params.area_ratio_threshold:
            return True
        
        perimeter = cv2.arcLength(contour, True)
        circularity = (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0
        
        if circularity < params.circularity_threshold:
            return True
        
        return False
    
    def process(self, image: np.ndarray) -> tuple:
        """전체 처리"""
        # 전처리
        binary_mask = self.preprocessor.process(image)
        
        # 까락 제거 (정조만)
        if self.config.awn_removal.enabled:
            binary_mask = self.awn_remover.process(binary_mask, method=self.config.awn_removal.method)
        
        # 면적 추정
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        params = self.config.separation
        areas = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > params.min_seed_area]
        
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
            if area < params.min_seed_area:
                continue
            
            # 정조: 개별 까락 제거
            if self.config.awn_removal.enabled:
                contour = self.awn_remover.process_contour(contour, image.shape)
            
            individual_mask = np.zeros(binary_mask.shape, dtype=np.uint8)
            cv2.drawContours(individual_mask, [contour], -1, 255, -1)
            
            if self.needs_separation(contour, single_seed_area):
                concave_points = self.find_concave_points(contour)
                separation_pairs = self.find_separation_pairs(concave_points, contour)
                
                if separation_pairs:
                    temp_mask = individual_mask.copy()
                    for p1, p2 in separation_pairs:
                        cv2.line(temp_mask, p1[1], p2[1], 0, 2)
                    sub_labels = self.apply_watershed(image, temp_mask)
                else:
                    sub_labels = self.apply_watershed(image, individual_mask)
                
                for label_val in np.unique(sub_labels):
                    if label_val == 0:
                        continue
                    sub_mask = (sub_labels == label_val).astype(np.uint8) * 255
                    sub_contours, _ = cv2.findContours(sub_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                    if sub_contours:
                        sub_contour = max(sub_contours, key=cv2.contourArea)
                        if cv2.contourArea(sub_contour) >= params.min_seed_area * 0.5:
                            seed_info = self._measure(sub_contour, current_label)
                            if self.validate_seed(seed_info):
                                result_labels[sub_labels == label_val] = current_label
                                all_seeds.append(seed_info)
                                current_label += 1
            else:
                seed_info = self._measure(contour, current_label)
                if self.validate_seed(seed_info):
                    result_labels[individual_mask > 0] = current_label
                    all_seeds.append(seed_info)
                    current_label += 1
        
        return all_seeds, result_labels
    
    def _measure(self, contour: np.ndarray, seed_id: int) -> dict:
        """측정"""
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
