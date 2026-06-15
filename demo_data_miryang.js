/**
 * demo_data_miryang.js
 *
 * 밀양 육성 벼 품종 기반 전과정 데모 데이터
 * - 11품종: 자포니카 중만생(영호진미·미소진품), 자포니카 조생(해담쌀·늘담·윤담),
 *   찰벼(백옥찰·wx), 반찰(백진주·Wx-mq), 통일계열(다산·금강1호·새고아미·새미면·Wxa)
 * - 31유전자: 전 12염색체에 걸친 유명 벼 유전자 (sd1, Wx, Hd1, Pi-ta, Xa21 등)
 * - 8표현형: 출수기, 초장, 수량, 아밀로스, 단백질, 쌀알 길이/너비, 분얼수
 *
 * 사용:
 *   DemoMiryang.load()  → 시뮬레이터 상태(varietyInfoData, genotypeData 등)에 주입
 *   DemoMiryang.toExcel() → 엑셀 파일로 내보내기
 */
(function (global) {
    'use strict';

    // ==================== 품종 정보 ====================
    const VARIETIES = [
        { name: '영호진미', pedigree: '영덕34호/밀양237호', type: 'Japonica', group: '중만생',   note: '고품질 밥쌀' },
        { name: '미소진품', pedigree: '진미/진부13호',    type: 'Japonica', group: '중만생',   note: '고품질 밥쌀' },
        { name: '해담쌀',   pedigree: '남평/진부44호',    type: 'Japonica', group: '조생',     note: '극조생' },
        { name: '늘담',     pedigree: '해담/진부42호',    type: 'Japonica', group: '조생',     note: '조생' },
        { name: '윤담',     pedigree: '해담/진부51호',    type: 'Japonica', group: '조생',     note: '조생' },
        { name: '백옥찰',   pedigree: '진부찰/백옥',      type: 'Japonica', group: '중생(찰)', note: '찰벼(wx)' },
        { name: '백진주',   pedigree: '진미계/Wx-mq',     type: 'Japonica', group: '중생(반찰)', note: '반찰(Wx-mq)' },
        { name: '다산',     pedigree: '밀양77호/수원계',  type: 'Tongil',   group: '중생',     note: '초다수(Wxa)' },
        { name: '금강1호',  pedigree: 'IR계/국내교잡',    type: 'Tongil',   group: '중생',     note: '다수(Wxa)' },
        { name: '새고아미', pedigree: 'IR계/일품',        type: 'Tongil',   group: '중생',     note: '초다수(Wxa)' },
        { name: '새미면',   pedigree: 'IR계/다산',        type: 'Tongil',   group: '중생',     note: '쌀국수용(Wxa)' },
    ];

    // ==================== 유전자 / 마커 위치 (전 12염색체) ====================
    // 위치는 Nipponbare IRGSP-1.0 기준 근사값 (bp)
    const MARKERS = [
        // Chr 1
        { name: 'sd1',       chr: 1,  bp: 38378668, desc: '반왜성(녹색혁명)' },
        { name: 'Gn1a',      chr: 1,  bp:  5268000, desc: '립수증가 CKX2' },
        { name: 'qSH1',      chr: 1,  bp: 38790000, desc: '탈립억제' },
        // Chr 2
        { name: 'Pib',       chr: 2,  bp: 35121382, desc: '도열병 R' },
        { name: 'Ehd1',      chr: 2,  bp: 32720000, desc: '조기출수 promoter' },
        // Chr 3
        { name: 'GS3',       chr: 3,  bp: 16729501, desc: '립크기' },
        { name: 'Hd6',       chr: 3,  bp: 31310000, desc: '출수기 CK2α' },
        { name: 'Hd16',      chr: 3,  bp:  2760000, desc: '출수기 억제' },
        // Chr 4
        { name: 'Sh4',       chr: 4,  bp: 34350000, desc: '탈립억제' },
        { name: 'Pi21',      chr: 4,  bp: 23060000, desc: '부분 도열병 R' },
        // Chr 5
        { name: 'GW5',       chr: 5,  bp:  5358998, desc: '립폭 QTL' },
        { name: 'xa5',       chr: 5,  bp:  4150000, desc: '흰잎마름병 열성 R' },
        // Chr 6
        { name: 'Wx',        chr: 6,  bp:  1765110, desc: '아밀로스(Wxa/Wxb/wx/Wx-mq)' },
        { name: 'Hd1',       chr: 6,  bp:  9329518, desc: '출수기 CO-like' },
        { name: 'Hd3a',      chr: 6,  bp:  2870000, desc: 'florigen' },
        { name: 'ALK',       chr: 6,  bp:  6743082, desc: '호화온도 SSIIa' },
        // Chr 7
        { name: 'Ghd7',      chr: 7,  bp:  9149715, desc: '출수/키/립수' },
        { name: 'GW7',       chr: 7,  bp: 24340000, desc: '립길이' },
        { name: 'Rc',        chr: 7,  bp:  6068985, desc: '적미 종피색' },
        { name: 'PROG1',     chr: 7,  bp:  2790000, desc: '직립성' },
        // Chr 8
        { name: 'DTH8',      chr: 8,  bp:  4330000, desc: '출수/키/립수' },
        { name: 'Badh2',     chr: 8,  bp: 20370000, desc: '향미(fgr)' },
        { name: 'xa13',      chr: 8,  bp: 27740000, desc: '흰잎마름병 R' },
        // Chr 9
        { name: 'Pi9',       chr: 9,  bp: 10383450, desc: '광역 도열병 R' },
        { name: 'DEP1',      chr: 9,  bp: 20410000, desc: '밀립형 이삭' },
        // Chr 10
        { name: 'OsMADS56',  chr: 10, bp:  1430000, desc: '개화억제' },
        { name: 'Pi-kh',     chr: 10, bp: 19880000, desc: '도열병 R' },
        // Chr 11
        { name: 'Xa21',      chr: 11, bp: 21700000, desc: '흰잎마름병 광역 R' },
        { name: 'Pikm',      chr: 11, bp: 27530000, desc: '도열병 R' },
        // Chr 12
        { name: 'Pi-ta',     chr: 12, bp: 10603772, desc: '도열병 R' },
        { name: 'Pi-ta2',    chr: 12, bp: 11200000, desc: '광역 도열병 R' },
    ];

    // ==================== 유전자형 매트릭스 ====================
    // 행: 품종(VARIETIES 순서), 열: 마커(MARKERS 순서)
    // 1 = favorable/carrier allele, 0 = reference/non-carrier
    // Wx: 1 = Wxa (통일계열 고아밀로스), 0 = Wxb/wx/Wx-mq (자포니카 저아밀로스)
    // eslint-disable no-multi-spaces
    const GENOTYPE = {
        //           sd1 Gn1a qSH1 Pib Ehd1 GS3 Hd6 Hd16 Sh4 Pi21 GW5 xa5 Wx Hd1 Hd3a ALK Ghd7 GW7 Rc PROG1 DTH8 Badh2 xa13 Pi9 DEP1 MADS56 Pi-kh Xa21 Pikm Pi-ta Pi-ta2
        '영호진미': [1, 0, 1, 1, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 1, 0],
        '미소진품': [1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 1, 1, 0],
        '해담쌀':   [1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
        '늘담':     [1, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0],
        '윤담':     [1, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
        '백옥찰':   [1, 0, 1, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        '백진주':   [1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        '다산':     [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 1],
        '금강1호':  [0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 0, 1, 0],
        '새고아미': [0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0],
        '새미면':   [0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0],
    };

    // ==================== 표현형 (이진 형질, 0/1) ====================
    // 시뮬레이터 v5.0 ML 파이프라인은 이진 분류기 전용 → 표현형은 0/1로 제공.
    // 1 = 형질 보유/우수, 0 = 미보유/열위
    //   단간성        : 초장 < 82cm
    //   조생성        : 출수기 < 115일
    //   다수성        : 수량 >= 600 kg/10a
    //   양질미        : 밥쌀용 고품질 (저아밀로스 자포니카)
    //   도열병저항성  : 도열병 저항성 점수 >= 3
    const BIN_PHENOTYPE = {
        //           단간성 조생성 다수성 양질미 도열병저항성
        '영호진미': { 단간성: 1, 조생성: 0, 다수성: 0, 양질미: 1, 도열병저항성: 1 },
        '미소진품': { 단간성: 1, 조생성: 0, 다수성: 0, 양질미: 1, 도열병저항성: 1 },
        '해담쌀':   { 단간성: 1, 조생성: 1, 다수성: 0, 양질미: 1, 도열병저항성: 0 },
        '늘담':     { 단간성: 1, 조생성: 1, 다수성: 0, 양질미: 1, 도열병저항성: 1 },
        '윤담':     { 단간성: 1, 조생성: 1, 다수성: 0, 양질미: 1, 도열병저항성: 0 },
        '백옥찰':   { 단간성: 1, 조생성: 0, 다수성: 0, 양질미: 0, 도열병저항성: 0 },
        '백진주':   { 단간성: 1, 조생성: 0, 다수성: 0, 양질미: 1, 도열병저항성: 0 },
        '다산':     { 단간성: 0, 조생성: 0, 다수성: 1, 양질미: 0, 도열병저항성: 1 },
        '금강1호':  { 단간성: 0, 조생성: 0, 다수성: 1, 양질미: 0, 도열병저항성: 1 },
        '새고아미': { 단간성: 0, 조생성: 0, 다수성: 1, 양질미: 0, 도열병저항성: 1 },
        '새미면':   { 단간성: 0, 조생성: 0, 다수성: 1, 양질미: 0, 도열병저항성: 1 },
    };

    // ==================== 농업특성 (연속값, 참고용) ====================
    // ML 학습에는 쓰지 않음 (이진화된 BIN_PHENOTYPE 사용). Excel 참고 시트로만 출력.
    const AGRONOMIC = {
        '영호진미': { 출수기: 135, 초장: 78, 수량: 550, 아밀로스: 18.0, 단백질: 6.5, 쌀알길이: 5.10, 쌀알너비: 2.95, 분얼수: 14 },
        '미소진품': { 출수기: 133, 초장: 77, 수량: 545, 아밀로스: 17.5, 단백질: 6.3, 쌀알길이: 5.00, 쌀알너비: 2.90, 분얼수: 14 },
        '해담쌀':   { 출수기: 105, 초장: 76, 수량: 520, 아밀로스: 18.2, 단백질: 6.4, 쌀알길이: 5.00, 쌀알너비: 2.92, 분얼수: 13 },
        '늘담':     { 출수기: 108, 초장: 77, 수량: 525, 아밀로스: 18.0, 단백질: 6.5, 쌀알길이: 5.10, 쌀알너비: 2.93, 분얼수: 13 },
        '윤담':     { 출수기: 110, 초장: 78, 수량: 530, 아밀로스: 17.8, 단백질: 6.4, 쌀알길이: 5.00, 쌀알너비: 2.94, 분얼수: 13 },
        '백옥찰':   { 출수기: 120, 초장: 78, 수량: 500, 아밀로스:  3.0, 단백질: 6.8, 쌀알길이: 4.90, 쌀알너비: 2.85, 분얼수: 13 },
        '백진주':   { 출수기: 122, 초장: 77, 수량: 530, 아밀로스: 10.5, 단백질: 6.2, 쌀알길이: 5.00, 쌀알너비: 2.90, 분얼수: 14 },
        '다산':     { 출수기: 118, 초장: 85, 수량: 720, 아밀로스: 24.5, 단백질: 7.2, 쌀알길이: 5.80, 쌀알너비: 2.65, 분얼수: 16 },
        '금강1호':  { 출수기: 120, 초장: 88, 수량: 680, 아밀로스: 23.8, 단백질: 7.0, 쌀알길이: 5.70, 쌀알너비: 2.70, 분얼수: 15 },
        '새고아미': { 출수기: 115, 초장: 83, 수량: 750, 아밀로스: 23.5, 단백질: 7.5, 쌀알길이: 5.60, 쌀알너비: 2.70, 분얼수: 17 },
        '새미면':   { 출수기: 122, 초장: 86, 수량: 640, 아밀로스: 25.5, 단백질: 7.3, 쌀알길이: 6.00, 쌀알너비: 2.55, 분얼수: 15 },
    };

    // ==================== 표현형별 유전자 매핑 ====================
    const TRAIT_GENES = [
        ['단간성',       ['sd1', 'Ghd7', 'DEP1', 'GS3']],
        ['조생성',       ['Ehd1', 'Hd1', 'Hd3a', 'Ghd7', 'DTH8', 'Hd6', 'Hd16']],
        ['다수성',       ['Gn1a', 'DEP1', 'GS3', 'GW5', 'GW7', 'DTH8']],
        ['양질미',       ['Wx', 'ALK']],
        ['도열병저항성', ['Pib', 'Pi-ta', 'Pi-ta2', 'Pi9', 'Pikm', 'Pi-kh', 'Pi21']],
        ['흰잎마름병저항성', ['Xa21', 'xa5', 'xa13']],
        ['탈립저항성',   ['qSH1', 'Sh4']],
        ['향미',         ['Badh2']],
    ];

    // ==================== 변환 유틸리티 ====================
    function buildVarietyInfoRows() {
        return VARIETIES.map(v => ({
            '품종명': v.name,
            '교배조합': v.pedigree,
            '재배형': v.type,
            '비고': `${v.group} · ${v.note}`
        }));
    }

    // 결측 유전자형 셀 (Tab 1 결측치 예측 기능 데모용)
    // 'variety||gene' 키. 8셀(약 2.3%)을 결측 처리 → 임퓨테이션 시연 가능.
    const MISSING_CELLS = new Set([
        '영호진미||Pi9',
        '미소진품||GS3',
        '해담쌀||Ehd1',
        '늘담||Wx',
        '윤담||DEP1',
        '백진주||ALK',
        '다산||qSH1',
        '새미면||Ghd7',
    ]);

    function buildGenotypeRows() {
        return VARIETIES.map(v => {
            const row = { '품종명': v.name };
            const genos = GENOTYPE[v.name];
            MARKERS.forEach((m, i) => {
                row[m.name] = MISSING_CELLS.has(`${v.name}||${m.name}`) ? '-' : String(genos[i]);
            });
            return row;
        });
    }

    function buildPhenotypeRows() {
        return VARIETIES.map(v => {
            const p = BIN_PHENOTYPE[v.name];
            const row = { '품종명': v.name };
            Object.keys(p).forEach(k => { row[k] = String(p[k]); });
            return row;
        });
    }

    function buildAgronomicRows() {
        return VARIETIES.map(v => Object.assign({ '품종명': v.name }, AGRONOMIC[v.name]));
    }

    function buildLinkageRows() {
        return MARKERS.map(m => ({
            '마커명': m.name,
            '염색체': m.chr,
            '시작위치(bp)': m.bp - 500,
            '끝위치(bp)': m.bp + 500,
            '설명': m.desc
        }));
    }

    function buildTraitGeneRows() {
        const rows = [];
        for (const [trait, genes] of TRAIT_GENES) {
            for (const g of genes) rows.push({ '형질': trait, '유전자': g });
        }
        return rows;
    }

    // ==================== 빌더 묶음 ====================
    function build() {
        return {
            varietyInfo: buildVarietyInfoRows(),
            genotype: buildGenotypeRows(),
            phenotype: buildPhenotypeRows(),
            linkage: buildLinkageRows(),
            traitGenes: buildTraitGeneRows(),
            markerPositionMap: MARKERS.reduce((acc, m) => {
                acc[m.name] = { chr: m.chr, start_bp: m.bp - 500, end_bp: m.bp + 500 };
                return acc;
            }, {}),
            traitGeneMap: TRAIT_GENES.reduce((acc, [t, gs]) => { acc[t] = gs.slice(); return acc; }, {}),
        };
    }

    // ==================== Excel 내보내기 ====================
    function toExcel() {
        if (typeof global.XLSX === 'undefined') {
            alert('XLSX 라이브러리 로드 안됨');
            return;
        }
        console.log('밀양 데모 Excel 내보내기 시작');
        const wb = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildVarietyInfoRows()), '품종정보');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildGenotypeRows()), '유전자형');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildPhenotypeRows()), '표현형');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildTraitGeneRows()), '표현형별 유전자 목록');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildLinkageRows()), '마커위치');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(buildAgronomicRows()), '농업특성(참고)');

        const filename = `밀양품종_데모데이터_${new Date().toISOString().slice(0, 10)}.xlsx`;
        XLSX.writeFile(wb, filename);
        console.log('Excel 저장 완료:', filename);
    }

    // ==================== 공개 API ====================
    global.DemoMiryang = {
        build,
        toExcel,
        VARIETIES,
        MARKERS,
        GENOTYPE,
        BIN_PHENOTYPE,
        AGRONOMIC,
        TRAIT_GENES
    };
    console.log('DemoMiryang 모듈 준비 완료:', {
        varieties: VARIETIES.length,
        markers: MARKERS.length,
        chromosomes: Array.from(new Set(MARKERS.map(m => m.chr))).sort((a, b) => a - b)
    });
})(typeof window !== 'undefined' ? window : this);
