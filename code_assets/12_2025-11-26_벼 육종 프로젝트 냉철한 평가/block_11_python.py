from sklearn.model_selection import LeaveOneGroupOut

# 계통군별로 묶어서 검증
# 예: "고시히카리 계통" 전체를 Test로
groups = df['계통군']  # 미리 정의 필요

logo = LeaveOneGroupOut()
for train_idx, test_idx in logo.split(X, y, groups=groups):
    # 특정 계통군 완전 제외하고 학습
    # → 신규 계통 예측력 시뮬레이션
