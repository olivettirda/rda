// 목표 형질을 JSON으로
const objectivesJson = JSON.stringify(selectedTraits.map(...));
pyodide.globals.set('py_objectives_json', objectivesJson);

await pyodide.runPythonAsync(`
    import json
    objectives_list = json.loads(py_objectives_json)
    objectives = [(obj['name'], obj['weight'], obj['is_minimize']) 
                  for obj in objectives_list]
`);
