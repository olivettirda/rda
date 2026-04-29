console.log(`SHAP 필터링 - 형질: ${pheno}, 관련유전자: ${relatedGenes.join(', ')}`);
console.log(`SHAP 필터링 - 첫 10개 유전자: ${genes.slice(0, 10).join(', ')}`);
console.log(`SHAP 필터링 결과: ${filteredIndices.length}개 매칭`);
