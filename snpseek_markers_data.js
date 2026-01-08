/**
 * 3K Rice Genomes SNP-Seek 기반 KASP 마커 데이터베이스
 *
 * 데이터 출처:
 * - Wang et al. (2018) Nature 557:43-49 "Genomic variation in 3,010 diverse accessions of Asian cultivated rice"
 * - SNP-Seek Database (http://snp-seek.irri.org)
 * - 3000 Rice Genomes Project AWS Public Data (s3://3kricegenome)
 *
 * 주요 유전자:
 * - 가화(Domestication) 유전자: Rc, Bh4, PROG1, OsC1, Sh4, Wx, GS3, qSH1, qSW5
 * - 녹색혁명 유전자: sd1
 * - 출수기 유전자: Hd1, Hd3a, Ghd7
 * - 내병성 유전자: Xa21, Pi-ta, Pi-b
 * - 품질 관련 유전자: Badh2 (향미), ALK (호화특성)
 */

const SNP_SEEK_MARKERS = {
    // ============ 가화(Domestication) 유전자 ============

    "sd1": {
        fullName: "semi-dwarf 1",
        description: "반왜성 유전자 - 녹색혁명의 핵심 유전자, 지베렐린 20-산화효소",
        chromosome: 1,
        position: 38382381,
        rapId: "Os01g0883800",
        msuId: "LOC_Os01g66100",
        ref: "G",
        alt: "A",
        effect: "반왜성 (alt 대립유전자 = 키 감소)",
        category: "plant_height",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=1&sstart=38372381&send=38392381",
        varieties: {
            "Nipponbare": { genotype: "G/G", code: "0", phenotype: "장간" },
            "IR64": { genotype: "A/A", code: "1", phenotype: "반왜성" },
            "IR8": { genotype: "A/A", code: "1", phenotype: "반왜성" },
            "Kasalath": { genotype: "G/G", code: "0", phenotype: "장간" },
            "93-11": { genotype: "A/A", code: "1", phenotype: "반왜성" },
            "Minghui63": { genotype: "A/A", code: "1", phenotype: "반왜성" },
            "Zhenshan97": { genotype: "A/A", code: "1", phenotype: "반왜성" },
            "일품": { genotype: "G/G", code: "0", phenotype: "장간" },
            "추청": { genotype: "G/G", code: "0", phenotype: "장간" },
            "삼광": { genotype: "A/A", code: "1", phenotype: "반왜성" },
            "새누리": { genotype: "A/A", code: "1", phenotype: "반왜성" }
        }
    },

    "Wx": {
        fullName: "Waxy (Granule-bound starch synthase I)",
        description: "찰성 유전자 - 아밀로스 함량 조절",
        chromosome: 6,
        position: 1765761,
        rapId: "Os06g0133000",
        msuId: "LOC_Os06g04200",
        ref: "G",
        alt: "T",
        effect: "G→T 변이 = 낮은 아밀로스 (찰벼)",
        category: "grain_quality",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=6&sstart=1755761&send=1775761",
        varieties: {
            "Nipponbare": { genotype: "T/T", code: "1", phenotype: "찰성 (저아밀로스)" },
            "IR64": { genotype: "G/G", code: "0", phenotype: "메성 (고아밀로스)" },
            "Kasalath": { genotype: "G/G", code: "0", phenotype: "메성" },
            "93-11": { genotype: "G/G", code: "0", phenotype: "메성" },
            "일품": { genotype: "T/T", code: "1", phenotype: "저아밀로스" },
            "추청": { genotype: "T/T", code: "1", phenotype: "저아밀로스" },
            "동진찰": { genotype: "T/T", code: "1", phenotype: "찰성" },
            "삼광": { genotype: "T/T", code: "1", phenotype: "저아밀로스" }
        }
    },

    "Rc": {
        fullName: "Red pericarp color",
        description: "종피색 유전자 - 적미/백미 결정",
        chromosome: 7,
        position: 6068985,
        rapId: "Os07g0211500",
        msuId: "LOC_Os07g11020",
        ref: "G",
        alt: "DEL14bp",
        effect: "14bp 결실 = 백색 종피",
        category: "domestication",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=7&sstart=6058985&send=6078985",
        varieties: {
            "Nipponbare": { genotype: "del/del", code: "1", phenotype: "백미" },
            "IR64": { genotype: "del/del", code: "1", phenotype: "백미" },
            "O.rufipogon": { genotype: "G/G", code: "0", phenotype: "적미 (야생형)" },
            "일품": { genotype: "del/del", code: "1", phenotype: "백미" },
            "추청": { genotype: "del/del", code: "1", phenotype: "백미" },
            "흑진주": { genotype: "G/G", code: "0", phenotype: "유색미" }
        }
    },

    "Sh4": {
        fullName: "SHATTERING4",
        description: "탈립성 유전자 - 비탈립성 선발의 핵심",
        chromosome: 4,
        position: 34633441,
        rapId: "Os04g0670900",
        msuId: "LOC_Os04g57530",
        ref: "G",
        alt: "T",
        effect: "G→T 변이 = 비탈립성",
        category: "domestication",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=4&sstart=34623441&send=34643441",
        varieties: {
            "Nipponbare": { genotype: "T/T", code: "1", phenotype: "비탈립" },
            "IR64": { genotype: "T/T", code: "1", phenotype: "비탈립" },
            "O.rufipogon": { genotype: "G/G", code: "0", phenotype: "탈립 (야생형)" },
            "일품": { genotype: "T/T", code: "1", phenotype: "비탈립" }
        }
    },

    "qSH1": {
        fullName: "QTL for seed shattering 1",
        description: "탈립성 QTL - 일본형 벼의 비탈립성 관여",
        chromosome: 1,
        position: 36424088,
        rapId: "Os01g0848400",
        msuId: "LOC_Os01g62920",
        ref: "G",
        alt: "T",
        effect: "SNP = 비탈립성",
        category: "domestication",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=1&sstart=36414088&send=36434088",
        varieties: {
            "Nipponbare": { genotype: "T/T", code: "1", phenotype: "비탈립" },
            "Kasalath": { genotype: "G/G", code: "0", phenotype: "탈립" },
            "일품": { genotype: "T/T", code: "1", phenotype: "비탈립" }
        }
    },

    "PROG1": {
        fullName: "PROSTRATE GROWTH 1",
        description: "직립성 유전자 - 포복형→직립형 전환",
        chromosome: 7,
        position: 20963598,
        rapId: "Os07g0558100",
        msuId: "LOC_Os07g38160",
        ref: "C",
        alt: "T",
        effect: "변이 = 직립형 생육",
        category: "domestication",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=7&sstart=20953598&send=20973598",
        varieties: {
            "Nipponbare": { genotype: "T/T", code: "1", phenotype: "직립형" },
            "IR64": { genotype: "T/T", code: "1", phenotype: "직립형" },
            "O.rufipogon": { genotype: "C/C", code: "0", phenotype: "포복형" }
        }
    },

    "Bh4": {
        fullName: "Black hull 4",
        description: "왕겨색 유전자 - 흑색/황색 왕겨",
        chromosome: 4,
        position: 20130195,
        rapId: "Os04g0460200",
        msuId: "LOC_Os04g38660",
        ref: "C",
        alt: "DEL22bp",
        effect: "22bp 결실 = 황색 왕겨",
        category: "domestication",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=4&sstart=20120195&send=20140195",
        varieties: {
            "Nipponbare": { genotype: "del/del", code: "1", phenotype: "황색 왕겨" },
            "IR64": { genotype: "del/del", code: "1", phenotype: "황색 왕겨" },
            "O.rufipogon": { genotype: "C/C", code: "0", phenotype: "흑색 왕겨" }
        }
    },

    "OsC1": {
        fullName: "OsC1 (Chromogen 1)",
        description: "안토시아닌 조절 유전자 - 식물체 착색",
        chromosome: 6,
        position: 29407162,
        rapId: "Os06g0655400",
        msuId: "LOC_Os06g42130",
        ref: "G",
        alt: "A",
        effect: "변이 = 착색 감소",
        category: "domestication",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=6&sstart=29397162&send=29417162",
        varieties: {
            "Nipponbare": { genotype: "A/A", code: "1", phenotype: "녹색 (비착색)" },
            "IR64": { genotype: "G/G", code: "0", phenotype: "착색" }
        }
    },

    // ============ 출수기 관련 유전자 ============

    "Hd1": {
        fullName: "Heading date 1",
        description: "출수기 유전자 - 광주기 반응 조절",
        chromosome: 6,
        position: 9339479,
        rapId: "Os06g0275000",
        msuId: "LOC_Os06g16370",
        ref: "functional",
        alt: "loss-of-function",
        effect: "기능 상실 = 조생화",
        category: "heading_date",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=6&sstart=9329479&send=9349479",
        varieties: {
            "Nipponbare": { genotype: "func/func", code: "0", phenotype: "정상 출수" },
            "Kasalath": { genotype: "lof/lof", code: "1", phenotype: "조생" },
            "일품": { genotype: "func/func", code: "0", phenotype: "중생" },
            "오대": { genotype: "lof/lof", code: "1", phenotype: "조생" }
        }
    },

    "Ghd7": {
        fullName: "Grain number, plant height, and heading date 7",
        description: "출수기/수량 복합 유전자",
        chromosome: 7,
        position: 9152331,
        rapId: "Os07g0261200",
        msuId: "LOC_Os07g15770",
        ref: "functional",
        alt: "non-functional",
        effect: "기능 변이 = 출수기/수량 변화",
        category: "heading_date",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=7&sstart=9142331&send=9162331",
        varieties: {
            "Nipponbare": { genotype: "nf/nf", code: "1", phenotype: "조생" },
            "Minghui63": { genotype: "func/func", code: "0", phenotype: "만생/다수" }
        }
    },

    // ============ 종자 크기/수량 유전자 ============

    "GS3": {
        fullName: "Grain size 3",
        description: "종자 길이 조절 유전자",
        chromosome: 3,
        position: 16733485,
        rapId: "Os03g0407400",
        msuId: "LOC_Os03g29360",
        ref: "C",
        alt: "A",
        effect: "C→A (종지코돈) = 장립형",
        category: "grain_size",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=3&sstart=16723485&send=16743485",
        varieties: {
            "Nipponbare": { genotype: "C/C", code: "0", phenotype: "단립형" },
            "93-11": { genotype: "A/A", code: "1", phenotype: "장립형" },
            "IR64": { genotype: "A/A", code: "1", phenotype: "장립형" },
            "일품": { genotype: "C/C", code: "0", phenotype: "단립형" },
            "추청": { genotype: "C/C", code: "0", phenotype: "단립형" }
        }
    },

    "GW5/qSW5": {
        fullName: "Grain width 5 / QTL for seed width 5",
        description: "종자 폭 조절 유전자",
        chromosome: 5,
        position: 5360424,
        rapId: "Os05g0187500",
        msuId: "LOC_Os05g09520",
        ref: "presence",
        alt: "1.2kb_del",
        effect: "1.2kb 결실 = 넓은 종자",
        category: "grain_size",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=5&sstart=5350424&send=5370424",
        varieties: {
            "Nipponbare": { genotype: "del/del", code: "1", phenotype: "광폭립" },
            "93-11": { genotype: "+/+", code: "0", phenotype: "세립" },
            "일품": { genotype: "del/del", code: "1", phenotype: "광폭립" }
        }
    },

    "Gn1a": {
        fullName: "Grain number 1a",
        description: "수당립수 조절 유전자 - 사이토키닌 산화효소",
        chromosome: 1,
        position: 5270564,
        rapId: "Os01g0197700",
        msuId: "LOC_Os01g10110",
        ref: "functional",
        alt: "enhanced",
        effect: "기능 증강 = 수당립수 증가",
        category: "yield",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=1&sstart=5260564&send=5280564",
        varieties: {
            "Nipponbare": { genotype: "func/func", code: "0", phenotype: "표준" },
            "Habataki": { genotype: "enh/enh", code: "1", phenotype: "다수성" }
        }
    },

    "GW2": {
        fullName: "Grain width 2",
        description: "종자 폭/수량 조절 - RING-type E3 ubiquitin ligase",
        chromosome: 2,
        position: 8080936,
        rapId: "Os02g0244100",
        msuId: "LOC_Os02g14720",
        ref: "functional",
        alt: "loss-of-function",
        effect: "기능 상실 = 대립/다수",
        category: "grain_size",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=2&sstart=8070936&send=8090936",
        varieties: {
            "Nipponbare": { genotype: "func/func", code: "0", phenotype: "표준" },
            "WY3": { genotype: "lof/lof", code: "1", phenotype: "대립" }
        }
    },

    // ============ 품질 관련 유전자 ============

    "Badh2": {
        fullName: "Betaine aldehyde dehydrogenase 2",
        description: "향미 유전자 - 2-acetyl-1-pyrroline 생성 조절",
        chromosome: 8,
        position: 20382871,
        rapId: "Os08g0424500",
        msuId: "LOC_Os08g32870",
        ref: "functional",
        alt: "8bp_del",
        effect: "8bp 결실 = 향미 발현",
        category: "grain_quality",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=8&sstart=20372871&send=20392871",
        varieties: {
            "Nipponbare": { genotype: "func/func", code: "0", phenotype: "비향미" },
            "Basmati370": { genotype: "del/del", code: "1", phenotype: "향미" },
            "Jasmine85": { genotype: "del/del", code: "1", phenotype: "향미" },
            "일품": { genotype: "func/func", code: "0", phenotype: "비향미" }
        }
    },

    "ALK/SSIIa": {
        fullName: "Alkali degeneration / Starch synthase IIa",
        description: "호화특성 유전자 - 알칼리 붕괴도, 호화온도",
        chromosome: 6,
        position: 6750226,
        rapId: "Os06g0229800",
        msuId: "LOC_Os06g12450",
        ref: "GC",
        alt: "TT",
        effect: "GC→TT = 낮은 호화온도",
        category: "grain_quality",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=6&sstart=6740226&send=6760226",
        varieties: {
            "Nipponbare": { genotype: "TT/TT", code: "1", phenotype: "저호화온도" },
            "IR64": { genotype: "GC/GC", code: "0", phenotype: "중간호화온도" },
            "일품": { genotype: "TT/TT", code: "1", phenotype: "저호화온도" }
        }
    },

    // ============ 내병성 유전자 ============

    "Xa21": {
        fullName: "Xanthomonas oryzae pv. oryzae resistance 21",
        description: "흰잎마름병 저항성 - LRR receptor kinase",
        chromosome: 11,
        position: 21278596,
        rapId: "Os11g0559200",
        msuId: "LOC_Os11g35500",
        ref: "susceptible",
        alt: "resistant",
        effect: "저항성 대립유전자",
        category: "disease_resistance",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=11&sstart=21268596&send=21288596",
        varieties: {
            "Nipponbare": { genotype: "S/S", code: "0", phenotype: "이병성" },
            "IRBB21": { genotype: "R/R", code: "1", phenotype: "저항성" },
            "일품": { genotype: "S/S", code: "0", phenotype: "이병성" }
        }
    },

    "Pi-ta": {
        fullName: "Pyricularia oryzae resistance ta",
        description: "도열병 저항성 - NBS-LRR",
        chromosome: 12,
        position: 10606359,
        rapId: "Os12g0281300",
        msuId: "LOC_Os12g18360",
        ref: "susceptible",
        alt: "resistant",
        effect: "A→G = 저항성",
        category: "disease_resistance",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=12&sstart=10596359&send=10616359",
        varieties: {
            "Nipponbare": { genotype: "S/S", code: "0", phenotype: "이병성" },
            "Tadukan": { genotype: "R/R", code: "1", phenotype: "저항성" },
            "화성": { genotype: "R/R", code: "1", phenotype: "저항성" }
        }
    },

    "Pi-b": {
        fullName: "Pyricularia oryzae resistance b",
        description: "도열병 저항성 - NBS-LRR",
        chromosome: 2,
        position: 35075706,
        rapId: "Os02g0839100",
        msuId: "LOC_Os02g57310",
        ref: "susceptible",
        alt: "resistant",
        effect: "저항성 대립유전자",
        category: "disease_resistance",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=2&sstart=35065706&send=35085706",
        varieties: {
            "Nipponbare": { genotype: "S/S", code: "0", phenotype: "이병성" },
            "BL1": { genotype: "R/R", code: "1", phenotype: "저항성" }
        }
    },

    // ============ 스트레스 저항성 ============

    "Sub1A": {
        fullName: "Submergence tolerance 1A",
        description: "침수저항성 - ERF 전사인자",
        chromosome: 9,
        position: 6875000,
        rapId: "Os09g0287000",
        msuId: "LOC_Os09g11460",
        ref: "absent",
        alt: "present",
        effect: "유전자 존재 = 침수저항성",
        category: "stress_tolerance",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=9&sstart=6865000&send=6885000",
        varieties: {
            "Nipponbare": { genotype: "-/-", code: "0", phenotype: "이병성" },
            "IR64-Sub1": { genotype: "+/+", code: "1", phenotype: "침수저항성" },
            "FR13A": { genotype: "+/+", code: "1", phenotype: "침수저항성" }
        }
    },

    "COLD1": {
        fullName: "Chilling tolerance divergence 1",
        description: "저온내성 - G-protein signaling",
        chromosome: 4,
        position: 30425000,
        rapId: "Os04g0572400",
        msuId: "LOC_Os04g50110",
        ref: "indica",
        alt: "japonica",
        effect: "japonica형 = 저온내성",
        category: "stress_tolerance",
        snpSeekUrl: "http://snp-seek.irri.org/_snp.zul?chrom=4&sstart=30415000&send=30435000",
        varieties: {
            "Nipponbare": { genotype: "jap/jap", code: "1", phenotype: "저온내성" },
            "93-11": { genotype: "ind/ind", code: "0", phenotype: "저온민감" },
            "일품": { genotype: "jap/jap", code: "1", phenotype: "저온내성" }
        }
    }
};

// 카테고리별 유전자 목록
const SNP_MARKER_CATEGORIES = {
    "domestication": {
        name: "가화 유전자",
        description: "벼 작물화 과정에서 선발된 유전자",
        markers: ["Rc", "Sh4", "qSH1", "PROG1", "Bh4", "OsC1"]
    },
    "plant_height": {
        name: "초장 관련",
        description: "초장(키) 조절 유전자",
        markers: ["sd1"]
    },
    "heading_date": {
        name: "출수기 관련",
        description: "출수기/개화기 조절 유전자",
        markers: ["Hd1", "Ghd7"]
    },
    "grain_size": {
        name: "종자 크기",
        description: "종자 길이/폭/천립중 조절",
        markers: ["GS3", "GW5/qSW5", "GW2", "Gn1a"]
    },
    "grain_quality": {
        name: "품질 관련",
        description: "식미, 호화특성, 향미 등",
        markers: ["Wx", "Badh2", "ALK/SSIIa"]
    },
    "disease_resistance": {
        name: "내병성",
        description: "병해 저항성 유전자",
        markers: ["Xa21", "Pi-ta", "Pi-b"]
    },
    "stress_tolerance": {
        name: "스트레스 저항성",
        description: "침수, 저온, 가뭄 등 비생물적 스트레스",
        markers: ["Sub1A", "COLD1"]
    }
};

// 주요 참조 품종 목록 (3K-RG 포함)
const REFERENCE_VARIETIES = {
    // Japonica (GJ) 그룹
    "japonica": [
        { name: "Nipponbare", origin: "Japan", group: "GJ-tmp", description: "참조 게놈 품종" },
        { name: "일품", origin: "Korea", group: "GJ-tmp", description: "한국 대표 자포니카" },
        { name: "추청", origin: "Korea", group: "GJ-tmp", description: "한국 주요 품종" },
        { name: "삼광", origin: "Korea", group: "GJ-tmp", description: "반왜성 자포니카" },
        { name: "새누리", origin: "Korea", group: "GJ-tmp", description: "다수성 품종" },
        { name: "오대", origin: "Korea", group: "GJ-tmp", description: "조생종" },
        { name: "동진찰", origin: "Korea", group: "GJ-tmp", description: "찰벼" }
    ],
    // Indica (XI) 그룹
    "indica": [
        { name: "IR64", origin: "IRRI", group: "XI-2", description: "열대 인디카 대표" },
        { name: "IR8", origin: "IRRI", group: "XI-1B", description: "녹색혁명 품종" },
        { name: "93-11", origin: "China", group: "XI-1A", description: "중국 인디카 참조" },
        { name: "Minghui63", origin: "China", group: "XI-1A", description: "하이브리드 부본" },
        { name: "Zhenshan97", origin: "China", group: "XI-1A", description: "하이브리드 모본" }
    ],
    // Aus (cA) 그룹
    "aus": [
        { name: "Kasalath", origin: "India", group: "cA", description: "Aus 그룹 대표" },
        { name: "N22", origin: "India", group: "cA", description: "내열성 품종" }
    ],
    // Basmati (cB) 그룹
    "basmati": [
        { name: "Basmati370", origin: "Pakistan", group: "cB", description: "향미 품종" }
    ]
};

// 유틸리티 함수
function getMarkersByCategory(category) {
    if (SNP_MARKER_CATEGORIES[category]) {
        return SNP_MARKER_CATEGORIES[category].markers.map(m => SNP_SEEK_MARKERS[m]).filter(m => m);
    }
    return [];
}

function getVarietyGenotype(markerName, varietyName) {
    const marker = SNP_SEEK_MARKERS[markerName];
    if (marker && marker.varieties[varietyName]) {
        return marker.varieties[varietyName];
    }
    return null;
}

function getSNPSeekUrl(markerName) {
    const marker = SNP_SEEK_MARKERS[markerName];
    return marker ? marker.snpSeekUrl : null;
}

// 모듈 내보내기 (ES6) 또는 전역 변수
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SNP_SEEK_MARKERS, SNP_MARKER_CATEGORIES, REFERENCE_VARIETIES };
}
