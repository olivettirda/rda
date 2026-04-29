// 모델 저장 구조
let trainedModels = {};  // {'형질명': {model: sklearnModel, accuracy: 0.87}}

// GA에서 직접 predict_proba 호출
const prob = await pyodide.runPythonAsync(`
    model = trained_models['${objName}']
    model.predict_proba([${genotype}])[0][1]
`);
