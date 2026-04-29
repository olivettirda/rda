from sklearn.model_selection import StratifiedKFold

# 재배형 비율 유지하며 5-fold
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for trait in phenotype_cols:
    scores = []
    for train_idx, test_idx in skf.split(X, df['재배형']):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
        
        model.fit(X_train, y_train)
        scores.append(f1_score(y_test, model.predict(X_test)))
    
    print(f"{trait}: {np.mean(scores):.3f} ± {np.std(scores):.3f}")
