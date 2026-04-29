# 마커 유사도 계산 (Jaccard distance)
from scipy.spatial.distance import pdist, squareform

genotype_matrix = df[marker_cols].values
distances = pdist(genotype_matrix, metric='jaccard')
dist_matrix = squareform(distances)

# 가장 먼 품종들을 Test셋으로
# → Train-Test 간 유전적 독립성 확보
