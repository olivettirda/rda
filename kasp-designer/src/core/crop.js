/**
 * crop.js — 작물 모드(벼 / 밀 / 일반) 메타데이터와 참고 문헌
 */
export const CROPS = Object.freeze({
  rice: Object.freeze({
    key: 'rice', label: '벼', latin: 'Oryza sativa', ensembl: 'oryza_sativa',
    genome: 'IRGSP-1.0', chrExample: 'Chr01:12345678', ploidy: '이배체 (2n = 24)',
    note: '기본 모드. 좌표는 IRGSP-1.0 (Chr01–Chr12). rsID 조회는 Ensembl Plants oryza_sativa.',
    homoeologs: false,
  }),
  wheat: Object.freeze({
    key: 'wheat', label: '밀', latin: 'Triticum aestivum', ensembl: 'triticum_aestivum',
    genome: 'IWGSC RefSeq v2.1', chrExample: '1A:12345678 (chr1A … 7D, Un)', ploidy: '육배체 (AABBDD, 2n = 42)',
    note: '육배체라 A·B·D 상동유전체(homoeolog)가 거의 같은 서열을 갖습니다. 상동유전체 서열을 함께 넣으면 프라이머가 목표 유전체에만 붙는지(PolyMarker 식 특이 / 반특이 / 비특이) 검사해 Common 후보 순위와 경고에 반영합니다. 품종 간 SNP 를 ASP 3′ 말단에 두고, Common 은 상동유전체와 다른 염기(3′ 말단 쪽)에 두는 것이 권장 전략입니다 (Makhoul et al. 2020).',
    homoeologs: true,
  }),
  generic: Object.freeze({
    key: 'generic', label: '일반', latin: '', ensembl: '',
    genome: '', chrExample: 'Chr1:12345', ploidy: '',
    note: '작물 공통 설정. 유전체 좌표 표기는 헤더에 쓴 그대로 사용하고, 상동/중복 서열이 있으면 함께 넣어 특이성을 검사할 수 있습니다.',
    homoeologs: true,
  }),
});

export function cropOf(key) {
  return CROPS[key] || CROPS.rice;
}

/** 참고 문헌: 공통 + 작물별 */
export const REFERENCES = Object.freeze({
  general: Object.freeze([
    { cite: 'SantaLucia J (1998) A unified view of polymer, dumbbell, and oligonucleotide DNA nearest-neighbor thermodynamics. PNAS 95:1460–1465.', doi: '10.1073/pnas.95.4.1460', why: 'Tm 최근접이웃 ΔH/ΔS' },
    { cite: 'Owczarzy R et al. (2004) Effects of sodium ions on DNA duplex oligomers: improved predictions of melting temperatures. Biochemistry 43:3537–3554.', doi: '10.1021/bi034621r', why: 'Na⁺ 염 보정' },
    { cite: 'Owczarzy R et al. (2008) Predicting stability of DNA duplexes in solutions containing magnesium and monovalent cations. Biochemistry 47:5336–5353.', doi: '10.1021/bi702363u', why: 'Mg²⁺ 염 보정' },
    { cite: 'Semagn K, Babu R, Hearne S, Olsen M (2014) Single nucleotide polymorphism genotyping using Kompetitive Allele Specific PCR (KASP): overview of the technology and its application in crop improvement. Mol Breeding 33:1–14.', doi: '10.1007/s11032-013-9917-x', why: 'KASP 원리와 작물 적용 개요' },
    { cite: 'Kalendar R et al. (2022) Front Mol Biosci 9:773956.', doi: '10.3389/fmolb.2022.773956', why: 'ASQ/KASP 대립유전자 특이 프라이머 설계 원리' },
    { cite: 'Kalendar R et al. (2017) FastPCR: An in silico tool for fast primer and probe design and advanced sequence analysis. Genomics 109:312–319.', doi: '10.1016/j.ygeno.2017.05.005', why: 'Linguistic complexity 지표' },
    { cite: 'Kalendar R (2025) Mol Ther Nucleic Acids 36(4):102716.', doi: '10.1016/j.omtn.2025.102716', why: '프라이머 설계 플랫폼' },
    { cite: 'LGC Biosearch Technologies. KASP genotyping chemistry — user guide and manual.', doi: '', why: 'FAM/HEX tail 서열, 반응 조건' },
  ]),
  rice: Object.freeze([
    { cite: 'Kawahara Y et al. (2013) Improvement of the Oryza sativa Nipponbare reference genome using next generation sequence and optical map data. Rice 6:4.', doi: '10.1186/1939-8433-6-4', why: 'IRGSP-1.0 기준 유전체' },
    { cite: 'Sakai H et al. (2013) Rice Annotation Project Database (RAP-DB): an integrative and interactive database for rice genomics. Plant Cell Physiol 54:e6.', doi: '10.1093/pcp/pcs183', why: 'RAP-DB 유전자 좌표' },
  ]),
  wheat: Object.freeze([
    { cite: 'Makhoul M, Rambla C, Voss-Fels KP, Hickey LT, Snowdon RJ, Obermeier C (2020) Overcoming polyploidy pitfalls: a user guide for effective SNP conversion into KASP markers in wheat. Theor Appl Genet 133:2413–2430.', doi: '10.1007/s00122-020-03608-x', why: '밀(육배체) KASP 설계 실무 지침 — 상동유전체 특이 프라이머' },
    { cite: 'Ramirez-Gonzalez RH, Uauy C, Caccamo M (2015) PolyMarker: a fast polyploid primer design pipeline. Bioinformatics 31:2038–2039.', doi: '10.1093/bioinformatics/btv069', why: '특이/반특이/비특이 프라이머 분류' },
    { cite: 'International Wheat Genome Sequencing Consortium (2018) Shifting the limits in wheat research and breeding using a fully annotated reference genome. Science 361:eaar7191.', doi: '10.1126/science.aar7191', why: 'IWGSC RefSeq v1.0' },
    { cite: 'Zhu T et al. (2021) Optical maps refine the bread wheat Triticum aestivum cv. Chinese Spring genome assembly. Plant J 107:303–314.', doi: '10.1111/tpj.15289', why: 'IWGSC RefSeq v2.1 좌표' },
    { cite: 'Rasheed A et al. (2016) Development and validation of KASP assays for genes underpinning key economic traits in bread wheat. Theor Appl Genet 129:1843–1860.', doi: '10.1007/s00122-016-2743-x', why: '밀 기능유전자 KASP 마커 사례' },
    { cite: 'Grewal S et al. (2020) Rapid identification of homozygosity and site of wild relative introgressions in wheat through chromosome-specific KASP genotyping assays. Plant Biotechnol J 18:743–755.', doi: '10.1111/pbi.13241', why: '염색체 특이 KASP 설계 사례' },
  ]),
  generic: Object.freeze([]),
});

export function referencesFor(cropKey) {
  const crop = cropOf(cropKey);
  return { general: REFERENCES.general, crop: REFERENCES[crop.key] || [], cropLabel: crop.label };
}
