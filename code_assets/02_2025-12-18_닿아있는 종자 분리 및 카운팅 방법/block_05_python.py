import cv2
import numpy as np
from scipy.ndimage import maximum_filter, label

class WatershedSegmenter:
    def __init__(self, distance_threshold_ratio=0.4):
        self.distance_threshold_ratio = distance_threshold_ratio
    
    def apply_watershed(self, image, binary_mask):
        dist = cv2.distanceTransform(binary_mask, cv2.DIST_L2, 5)
        
        local_max = maximum_filter(dist, size=25)
        threshold = dist.max() * self.distance_threshold_ratio
        seeds = (dist == local_max) & (dist > threshold)
        
        markers, num_seeds = label(seeds)
        
        if num_seeds == 0:
            markers[binary_mask > 0] = 1
            return markers
        
        kernel = np.ones((3, 3), np.uint8)
        sure_bg = cv2.dilate(binary_mask, kernel, iterations=3)
        markers = markers + 1
        markers[sure_bg == 0] = 1
        markers[(binary_mask > 0) & (markers == 1)] = 0
        
        markers = markers.astype(np.int32)
        cv2.watershed(image, markers)
        
        markers[markers <= 1] = 0
        markers = markers - 1
        markers[markers < 0] = 0
        
        return markers
