import cv2
import numpy as np

class ModeAwarePreprocessor:
    """모드별 전처리기"""
    
    def __init__(self, config: SeedModeConfig):
        self.config = config
        self.background_color = "blue"
        
        self.color_ranges = {
            "blue": {"lower": np.array([100, 80, 50]), "upper": np.array([130, 255, 255])},
            "white": {"lower": np.array([0, 0, 200]), "upper": np.array([180, 30, 255])},
            "black": {"lower": np.array([0, 0, 0]), "upper": np.array([180, 255, 50])}
        }
    
    def preprocess_rough_rice(self, image: np.ndarray) -> np.ndarray:
        """정조 전처리"""
        # 1. CLAHE 적용 (표면 텍스처 강조)
        if self.config.texture.use_clahe:
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            image = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        # 2. 배경 분리
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        color_range = self.color_ranges.get(self.background_color)
        bg_mask = cv2.inRange(hsv, color_range["lower"], color_range["upper"])
        fg_mask = cv2.bitwise_not(bg_mask)
        
        # 3. 에지 강조 (선택적)
        if self.config.texture.edge_enhancement:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            # 에지를 마스크에 반영
            kernel = np.ones((3, 3), np.uint8)
            edges_dilated = cv2.dilate(edges, kernel, iterations=1)
            fg_mask = cv2.bitwise_and(fg_mask, cv2.bitwise_not(edges_dilated))
        
        # 4. 강한 모폴로지 (거친 표면 정리)
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel, iterations=2)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel, iterations=3)
        
        return fg_mask
    
    def preprocess_brown_rice(self, image: np.ndarray) -> np.ndarray:
        """현미 전처리"""
        # 1. 배경 분리 (단순)
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        color_range = self.color_ranges.get(self.background_color)
        bg_mask = cv2.inRange(hsv, color_range["lower"], color_range["upper"])
        fg_mask = cv2.bitwise_not(bg_mask)
        
        # 2. 가벼운 모폴로지 (매끈한 표면 유지)
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel_small, iterations=1)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel_small, iterations=2)
        
        return fg_mask
    
    def process(self, image: np.ndarray) -> np.ndarray:
        """모드에 따라 전처리 수행"""
        if self.config.seed_type == SeedType.ROUGH_RICE:
            return self.preprocess_rough_rice(image)
        else:
            return self.preprocess_brown_rice(image)
