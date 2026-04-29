1. 거리 변환 (Distance Transform)
   - cv2.distanceTransform(mask, cv2.DIST_L2, 5)

2. 지역 최대점 탐지 (Local Maxima)
   - scipy.ndimage.maximum_filter(size=25)
   - 임계값: max * 0.4

3. 마커 생성 및 Watershed 적용
   - cv2.watershed()
   - 결과: 각 종자에 고유 라벨 부여
