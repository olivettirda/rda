    Plotly.newPlot('shapPlot', [trace], layout, { responsive: true });
    
    // 설명
    if (explanationEl) {
        const topGene = data.genes?.[0] || 'N/A';
        ...
        explanationEl.innerHTML = `...`;  // ← 여기서 덮어씀!!!
    }
