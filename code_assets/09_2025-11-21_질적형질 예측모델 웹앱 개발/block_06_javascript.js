// 부모 유전자형과 설정을 JSON으로
pyodide.globals.set('py_parent1_json', JSON.stringify(parent1Geno));
pyodide.globals.set('py_parent2_json', JSON.stringify(parent2Geno));
pyodide.globals.set('py_gene_names_json', JSON.stringify(appData.genes));
pyodide.globals.set('py_trait_gene_map_json', JSON.stringify(appData.phenotypeGeneMap));

await pyodide.runPythonAsync(`
    import json
    py_parent1 = json.loads(py_parent1_json)
    ...
`);
