# 전략: 시간순 분할 (오래된 품종으로 학습 → 최신 품종으로 검증)

# 1. 품종을 육성 연도 기준으로 정렬
varieties_sorted = variety_data.sort_values('year_released')

# 2. 80% (구품종) vs 20% (신품종) 분할
split_idx = int(len(varieties_sorted) * 0.8)
train_varieties = varieties_sorted.iloc[:split_idx]['variety_name']
test_varieties = varieties_sorted.iloc[split_idx:]['variety_name']

X_train = genotype_data[genotype_data['variety'].isin(train_varieties)]
X_test = genotype_data[genotype_data['variety'].isin(test_varieties)]

y_train = phenotype_data[phenotype_data['variety'].isin(train_varieties)]
y_test = phenotype_data[phenotype_data['variety'].isin(test_varieties)]

# 3. 형질별 학습 및 평가
for trait in phenotype_columns:
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train[trait])
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test[trait], y_pred)
    
    print(f"{trait}: {accuracy:.3f}")
