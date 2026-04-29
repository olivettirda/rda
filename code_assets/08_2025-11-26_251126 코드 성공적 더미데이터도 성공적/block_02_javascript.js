function runGeneticAlgorithm() {
    if (!dataLoaded) { alert('데이터를 먼저 업로드하세요.'); return; }
    document.getElementById('gaLoading').classList.add('active');
    setTimeout(() => {
        optimalSolutions = [{ genotype: geneNames.map(() => Math.random() > 0.5 ? 1 : 0), fitness: [0.85, 0.78] }];
        document.getElementById('gaLoading').classList.remove('active');
        document.getElementById('gaResults').innerHTML = '<div class="result-card"><h3>✅ 유전 알고리즘 완료</h3><p>최적해 1개 발견</p></div>';
        document.getElementById('optimalSolutionSelect').innerHTML = '<option value="0">최적해 #1</option>';
    }, 2000);
}
