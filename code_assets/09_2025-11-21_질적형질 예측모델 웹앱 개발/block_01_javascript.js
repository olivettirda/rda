// pyodide.globals.set() 사용 (타입 안전)
pyodide.globals.set('py_objectives', objectivesForPython);
pyodide.globals.set('py_gene_count', appData.genes.length);
pyodide.globals.set('py_pop_size', popSize);

await pyodide.runPythonAsync(`
    objectives = [(obj['name'], obj['weight'], obj['is_minimize']) 
                  for obj in py_objectives]
    ga = NSGA2(gene_count=py_gene_count, ...)
`);
