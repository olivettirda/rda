if use_grid_search:
    grid_search = GridSearchCV(
        base_model, 
        param_grid, 
        cv=min(3, cv_fold),  # 학습 시간 단축 위해 cv=3
        scoring='f1',
        n_jobs=-1,  # 병렬 처리
        refit=True
    )
    grid_search.fit(X_train, y_train)
    model = grid_search.best_estimator_
    best_params = grid_search.best_params_
