if (filteredIndices.length > 0) {
    genes = filteredIndices.map(i => genes[i]);  // 문제! genes를 덮어쓰기 전에 참조하고 있음
    shapValues = filteredIndices.map(i => shapValues[i]);
    shapStd = filteredIndices.map(i => shapStd[i] || 0);
