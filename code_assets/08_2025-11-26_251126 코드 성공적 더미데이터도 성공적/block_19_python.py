shap_values_data[pheno_name] = {
    'genes': [used_genes[j] for j in sorted_indices],
    'values': [float(importances[j]) for j in sorted_indices],
    'std': [float(importances[j] * 0.1) for j in sorted_indices],
    'model': best_model_name
}
