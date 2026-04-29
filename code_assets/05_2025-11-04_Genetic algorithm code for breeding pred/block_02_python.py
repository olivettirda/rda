# 각 유전자의 중요도 파악
feature_importance = pd.DataFrame({
    'gene': blast_gene_columns,
    'leaf_importance': rf_leaf.feature_importances_,
    'panicle_importance': rf_panicle.feature_importances_
})
feature_importance.sort_values('leaf_importance', ascending=False)
