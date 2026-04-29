from sklearn.model_selection import KFold, cross_val_score

# 각 형질별로 독립적으로 평가
for trait in phenotype_cols:
    y = df[trait]
    X = df[marker_cols]
    
    scores = cross_val_score(
        RandomForestClassifier(n_estimators=100),
        X, y, cv=5, scoring='f1_weighted'
    )
    
    print(f"{trait}: {scores.mean():.3f} ± {scores.std():.3f}")
