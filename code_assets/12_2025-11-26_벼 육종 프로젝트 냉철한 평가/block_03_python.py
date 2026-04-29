from sklearn.model_selection import StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report

# 형질별로 독립적으로 검증
for trait in phenotype_columns:
    X = genotype_data  # (300, 15) - 15개 마커
    y = phenotype_data[trait]  # (300,) - 해당 형질
    
    # 5-Fold Stratified CV (클래스 비율 유지)
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    cv_scores = []
    for fold, (train_idx, test_idx) in enumerate(skf.split(X, y)):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
        
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=5,  # 과적합 방지
            min_samples_split=10,  # 과적합 방지
            random_state=42
        )
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        accuracy = accuracy_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred, average='weighted')
        
        cv_scores.append({
            'fold': fold + 1,
            'accuracy': accuracy,
            'f1_score': f1
        })
    
    # 형질별 결과 출력
    print(f"\n[{trait}]")
    print(f"평균 정확도: {np.mean([s['accuracy'] for s in cv_scores]):.3f}")
    print(f"표준편차: {np.std([s['accuracy'] for s in cv_scores]):.3f}")
    print(f"F1-Score: {np.mean([s['f1_score'] for s in cv_scores]):.3f}")
