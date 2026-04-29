// JavaScript 객체를 직접 전달 (문제)
const data = [{name: "A", value: 1}];
pyodide.globals.set('py_data', data);  // JsProxy로 래핑됨

await pyodide.runPythonAsync(`
    for item in py_data:  # ❌ 에러
        print(item['name'])
`);
