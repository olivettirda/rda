import cv2
import numpy as np

class Preprocessor:
    def __init__(self, background_color="blue"):
        self.color_ranges = {
            "blue": {"lower": np.array([100, 80, 50]), "upper": np.array([130, 255, 255])},
            "white": {"lower": np.array([0, 0, 200]), "upper": np.array([180, 30, 255])},
            "black": {"lower": np.array([0, 0, 0]), "upper": np.array([180, 255, 50])}
        }
        self.background_color = background_color
    
    def process(self, image):
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        color_range = self.color_ranges.get(self.background_color, self.color_ranges["blue"])
        
        bg_mask = cv2.inRange(hsv, color_range["lower"], color_range["upper"])
        fg_mask = cv2.bitwise_not(bg_mask)
        
        kernel_small = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        kernel_large = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel_small, iterations=2)
        fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, kernel_large, iterations=2)
        
        return fg_mask
