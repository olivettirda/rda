// Before (에러 발생)
pyodide.globals.set('trait_gene_mapping', traitGeneMapping);

// After (정상 동작)
pyodide.globals.set('trait_gene_mapping_json', JSON.stringify(traitGeneMapping));
// Python에서: trait_gene_mapping = json.loads(trait_gene_mapping_json)
