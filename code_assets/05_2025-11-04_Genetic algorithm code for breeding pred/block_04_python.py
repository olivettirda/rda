# 히트맵으로 유전자 조합 패턴 시각화
import seaborn as sns

plt.figure(figsize=(12, 8))
sns.heatmap(top_individuals.T, cmap='RdYlGn', 
            xticklabels=[f'Solution {i+1}' for i in range(10)],
            yticklabels=blast_gene_columns + palatability_gene_columns)
plt.title('Top 10 Optimal Gene Combinations')
