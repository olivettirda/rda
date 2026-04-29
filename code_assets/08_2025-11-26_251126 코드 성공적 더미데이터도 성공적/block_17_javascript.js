// 엑셀에서 "표현형별 유전자 목록" 시트 자동 감지 & 로드
const traitGeneSheet = wb.Sheets['표현형별 유전자 목록'] || wb.Sheets['형질별 유전자'] || wb.Sheets['TraitGeneMapping'];
if (traitGeneSheet) {
    // 기존 하드코딩 매핑에 추가 (덮어쓰기 X)
    traitGeneList.forEach(row => {
        if (!traitGeneMapping[trait].includes(gene)) {
            traitGeneMapping[trait].push(gene);
        }
    });
    log(`📋 표현형별 유전자 목록 로드: 16행, 신규 N개 매핑 추가`, 'success');
}
