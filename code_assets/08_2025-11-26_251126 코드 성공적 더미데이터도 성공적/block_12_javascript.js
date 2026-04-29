// 이전 요약 div 제거
const oldSummary = document.getElementById('simBoxSummary');
if (oldSummary) oldSummary.remove();

// 새 요약 추가
const summaryDiv = document.createElement('div');
summaryDiv.id = 'simBoxSummary';  // ID 부여
