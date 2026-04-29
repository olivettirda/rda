// Before (문제)
const val = pred.predictions[p]?.mean || pred.predictions[p] || 0;

// After (해결)
const predValue = pred.predictions[p];
let val = 0;
if (predValue && typeof predValue === 'object') {
    val = predValue.mean !== undefined ? predValue.mean : 0;
} else if (typeof predValue === 'number') {
    val = predValue;
}
