from sklearn.inspection import permutation_importance

# 각 마커를 무작위로 섞었을 때 성능 하락 측정
perm_importance = permutation_importance(
    model, X_test, y_test,
    n_repeats=30, random_state=42
)

# 중요도가 음수 or 0에 가까운 마커 발견 시
# → 해당 마커는 예측에 기여 안 함
# → 15개 중 실제론 7개만 유의미할 수도
