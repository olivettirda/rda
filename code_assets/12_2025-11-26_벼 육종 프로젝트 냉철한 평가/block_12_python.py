# 이진 형질 (도열병저항성, 찰성 등)
metrics_binary = {
    'Accuracy': accuracy_score,
    'F1': f1_score,
    'Precision': precision_score,
    'Recall': recall_score,
    'ROC-AUC': roc_auc_score
}

# 다중클래스 형질 (재배형, 미질등급 등)
metrics_multiclass = {
    'Accuracy': accuracy_score,
    'F1_weighted': partial(f1_score, average='weighted'),
    'Balanced_Acc': balanced_accuracy_score
}

# 불균형 데이터 대응
# 예: 도열병 저항성 보유 품종 10% vs 미보유 90%
# → F1 score가 Accuracy보다 중요
