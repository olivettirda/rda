# 곡률 계산 공식
# k = (x'y'' - y'x'') / (x'^2 + y'^2)^(3/2)

1. 윤곽선 스무딩
   - Gaussian smoothing (sigma=3.0)

2. 1차/2차 미분 계산
   - np.gradient() 사용

3. 곡률 계산 및 피크 탐지
   - scipy.signal.find_peaks()
   - height 임계값: 0.015
   - 최소 피크 간격: 15픽셀

4. 오목점(Concave Points) 추출
   - 음의 곡률에서 피크인 점
   - 이 점들이 종자 접촉 경계 후보
