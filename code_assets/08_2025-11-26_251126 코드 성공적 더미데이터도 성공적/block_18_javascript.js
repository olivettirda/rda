// 현재 데이터(phenotypeNames)에 있는 형질만 필터링해서 표시
const availableTraits = Object.keys(traitGeneMapping).filter(trait => {
    if (phenotypeNames.includes(trait)) return true;  // 정확 매칭
    // 부분 매칭 ("흰잎마름병 저항성" ↔ "흰잎마름병 저항성 K1 균주")
    return phenotypeNames.some(p => p.includes(trait) || trait.includes(p));
});
// → 등록된 형질: 잎도열병 저항성, 흰잎마름병 저항성, 탈립 내성, ...
