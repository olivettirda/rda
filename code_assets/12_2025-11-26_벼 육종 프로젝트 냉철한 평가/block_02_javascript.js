const traitInfo = {
    '도열병저항성': { type: 'qualitative', mode: 'dominant' },
    '찰성': { type: 'qualitative', mode: 'recessive' },
    '식미': { type: 'quantitative', qtls: 15 },
    '수량': { type: 'quantitative', qtls: 50 }
};

// 형질별 맞춤 예측
if (traitInfo[trait].mode === 'dominant') {
    offspring = (p1 || p2) ? 1 : 0;
} else if (traitInfo[trait].mode === 'recessive') {
    offspring = (p1 && p2) ? 1 : 0;
} else if (traitInfo[trait].type === 'quantitative') {
    offspring = predictQTL(p1, p2, qtlEffects);
}
