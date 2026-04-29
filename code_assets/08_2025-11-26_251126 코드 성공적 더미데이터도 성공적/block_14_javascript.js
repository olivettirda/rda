// 설명
if (explanationEl) {
    const topGene = data.genes?.[0] || 'N/A';
    const topValue = data.values?.[0]?.toFixed(4) || 'N/A';
    const relatedInfo = geneFilter === 'related' && traitGeneMapping[pheno] 
        ? `<p>🔗 <strong>관련 유전자:</strong> ${traitGeneMapping[pheno].join(', ')}</p>` : '';
    
    explanationEl.innerHTML = `
        <p><strong>📌 SHAP 해석 가이드:</strong></p>
        ...
    `;
}
