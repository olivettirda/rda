if (json.length > 0) {
    const firstRow = json[0];
    if (typeof firstRow[0] === 'string' && 
        (firstRow[0].includes('품종') || firstRow[0].toLowerCase().includes('variety'))) {
        hasHeader = true;
    }
}

const startIdx = hasHeader ? 1 : 0;
for (let i = startIdx; i < json.length; i++) {
    const row = json[i];
    if (row && row[0] && row[1] !== undefined) {
        parsedData.push({
            variety: String(row[0]).trim(),
            value: parseFloat(row[1])
        });
    }
}
