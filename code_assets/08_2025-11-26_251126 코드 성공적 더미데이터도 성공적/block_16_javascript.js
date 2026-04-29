// 수정 전 (문제 코드)
if (explanationEl) {
    explanationEl.innerHTML = `...`;  // 무조건 덮어씀!
}

// 수정 후
if (explanationEl && geneFilter !== 'related') {  // 필터 모드가 아닐 때만
    explanationEl.innerHTML = `...`;
}
