# 재배형 비율 유지하며 분할
from sklearn.model_selection import train_test_split

# 300품종 → Train 240 / Validation 30 / Test 30
# Japonica:Tongil:Indica 비율 유지

train_df, temp_df = train_test_split(
    df, test_size=0.2, stratify=df['재배형'], random_state=42
)

val_df, test_df = train_test_split(
    temp_df, test_size=0.5, stratify=temp_df['재배형'], random_state=42
)
