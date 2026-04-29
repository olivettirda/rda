from sklearn.model_selection import LeaveOneOut

# 품종 수가 적을 때 (300개)
loo = LeaveOneOut()

for trait in phenotype_columns:
    predictions = []
    actuals = []
    
    for train_idx, test_idx in loo.split(X):
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
        
        model = RandomForestClassifier(n_estimators=50, random_state=42)
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        predictions.append(y_pred[0])
        actuals.append(y_test[0])
    
    accuracy = accuracy_score(actuals, predictions)
    print(f"{trait}: {accuracy:.3f}")
