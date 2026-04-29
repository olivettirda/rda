from sklearn.model_selection import RandomizedSearchCV

param_dist = {
    'n_estimators': [100, 200, 300],
    'max_depth': [10, 20, None],
    'min_samples_split': [2, 5, 10]
}

rf_optimized = RandomizedSearchCV(
    RandomForestClassifier(), 
    param_dist, 
    n_iter=20,
    cv=kf_classification,
    scoring='accuracy'
)
