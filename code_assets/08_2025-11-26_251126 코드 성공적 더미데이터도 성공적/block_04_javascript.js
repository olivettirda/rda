// 기존: 단순 키 필터링 (품종명이 포함될 수 있음)
phenotypeNames = Object.keys(phenotypeData[0]).filter(k => !excludeKeys.includes(k));

// 수정: 숫자 데이터가 있는 열만 선택
phenotypeNames = Object.keys(phenotypeData[0]).filter(k => {
    if (excludeKeys.includes(k)) return false;
    return phenotypeData.some(row => !isNaN(parseFloat(row[k])));
});
