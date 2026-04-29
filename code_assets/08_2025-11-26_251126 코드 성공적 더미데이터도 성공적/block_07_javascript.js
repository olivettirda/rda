// 1단계: 모든 교배조합 한번에 찾기 (Python 1회)
const combosResult = await pyodide.runPythonAsync(findCombosCode);

// 2단계: 모든 후대 한번에 예측 (Python 1회)
pyodide.globals.set('parent_pairs', parentPairs);  // 모든 조합을 배열로 전달
const predictResults = await pyodide.runPythonAsync(predictCode);
