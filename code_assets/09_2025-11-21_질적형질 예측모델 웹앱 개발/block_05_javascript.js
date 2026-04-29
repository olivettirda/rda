// 모든 배열을 JSON으로
pyodide.globals.set('py_solution_json', JSON.stringify(solution.genotype));
pyodide.globals.set('py_genotypes_json', JSON.stringify(varietyGenotypes));
pyodide.globals.set('py_names_json', JSON.stringify(varietyNames));
pyodide.globals.set('py_ecotypes_json', JSON.stringify(ecotypes));

await pyodide.runPythonAsync(`
    import json
    py_solution = json.loads(py_solution_json)
    py_genotypes = json.loads(py_genotypes_json)
    ...
`);
