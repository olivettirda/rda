class SeedSeparator:
    def __init__(self, min_seed_area=500):
        self.preprocessor = Preprocessor()
        self.curvature_analyzer = CurvatureAnalyzer()
        self.watershed = WatershedSegmenter()
        self.min_seed_area = min_seed_area
    
    def estimate_single_seed_area(self, binary_mask):
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        areas = [cv2.contourArea(c) for c in contours if cv2.contourArea(c) > self.min_seed_area]
        
        if not areas:
            return self.min_seed_area * 2
        
        median = np.median(areas)
        filtered = [a for a in areas if median * 0.5 < a < median * 1.5]
        return np.mean(filtered) if filtered else median
    
    def process(self, image):
        binary_mask = self.preprocessor.process(image)
        single_seed_area = self.estimate_single_seed_area(binary_mask)
        
        contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        
        result_labels = np.zeros(binary_mask.shape, dtype=np.int32)
        current_label = 1
        all_seeds = []
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area < self.min_seed_area:
                continue
            
            individual_mask = np.zeros(binary_mask.shape, dtype=np.uint8)
            cv2.drawContours(individual_mask, [contour], -1, 255, -1)
            
            # 분리 필요 판단
            perimeter = cv2.arcLength(contour, True)
            circularity = (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0
            needs_separation = area > single_seed_area * 1.4 or circularity < 0.65
            
            if needs_separation:
                # 곡률 분석
                concave_points = self.curvature_analyzer.find_concave_points(contour)
                separation_pairs = self.curvature_analyzer.find_separation_pairs(concave_points, contour)
                
                # 분리선 적용
                if separation_pairs:
                    temp_mask = individual_mask.copy()
                    for p1, p2 in separation_pairs:
                        cv2.line(temp_mask, p1[1], p2[1], 0, 2)
                    sub_labels = self.watershed.apply_watershed(image, temp_mask)
                else:
                    sub_labels = self.watershed.apply_watershed(image, individual_mask)
                
                # 라벨 병합
                for label_val in np.unique(sub_labels):
                    if label_val == 0:
                        continue
                    sub_mask = (sub_labels == label_val).astype(np.uint8) * 255
                    sub_contours, _ = cv2.findContours(sub_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
                    if sub_contours:
                        sub_contour = max(sub_contours, key=cv2.contourArea)
                        if cv2.contourArea(sub_contour) >= self.min_seed_area * 0.5:
                            result_labels[sub_labels == label_val] = current_label
                            all_seeds.append(self._measure(sub_contour, current_label))
                            current_label += 1
            else:
                result_labels[individual_mask > 0] = current_label
                all_seeds.append(self._measure(contour, current_label))
                current_label += 1
        
        return all_seeds, result_labels
    
    def _measure(self, contour, seed_id):
        area = cv2.contourArea(contour)
        perimeter = cv2.arcLength(contour, True)
        M = cv2.moments(contour)
        cx = int(M["m10"] / M["m00"]) if M["m00"] != 0 else 0
        cy = int(M["m01"] / M["m00"]) if M["m00"] != 0 else 0
        
        if len(contour) >= 5:
            (_, (minor, major), _) = cv2.fitEllipse(contour)
        else:
            major = minor = 0
        
        return {
            "id": seed_id,
            "centroid": (cx, cy),
            "area": area,
            "perimeter": perimeter,
            "major_axis": major,
            "minor_axis": minor,
            "aspect_ratio": major / minor if minor > 0 else 0,
            "circularity": (4 * np.pi * area) / (perimeter ** 2) if perimeter > 0 else 0,
            "contour": contour
        }
