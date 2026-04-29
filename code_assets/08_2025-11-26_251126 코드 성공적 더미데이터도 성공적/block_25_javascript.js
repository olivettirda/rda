// Tab 2에서 모델 학습 시 feature_importances 저장
let featureImportances = {};  // {'형질명': [gene1_imp, gene2_imp, ...]}

// evaluate_fitness에서 사용
score = np.dot(genotype, correlations * feature_importances[obj_idx])
