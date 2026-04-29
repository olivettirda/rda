// JSON 문자열로 변환 후 전달 (해결)
const data = [{name: "A", value: 1}];
pyodide.globals.set('py_data_json', JSON.stringify(data));

await pyodide.runPythonAsync(`
    import json
    py_data = json.loads(py_data_json)  # ✅ 정상 작동
    for item in py_data:
        print(item['name'])  # ✅ 정상 작동
`);
