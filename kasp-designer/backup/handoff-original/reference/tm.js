'use strict';
/**
 * tm.js — 클린룸 구현 Tm 계산 레퍼런스 모듈 (검증용)
 *
 * 공개 문헌 기반:
 *  - SantaLucia J. (1998) PNAS 95:1460  — 통합 최근접이웃 ΔH/ΔS, 개시(initiation) 항, 자기상보 보정
 *  - Owczarzy R. et al. (2004) Biochemistry 43:3537 — 1가 양이온(Na+) 보정
 *  - Owczarzy R. et al. (2008) Biochemistry 47:5336 — Mg2+ 보정 (R = sqrt[Mg]/[Na] 분기)
 *  - Wallace rule: Tm = 2(A+T) + 4(G+C), 15 nt 미만 짧은 올리고용
 *
 * 두 가지 프리셋을 제공합니다.
 *  - PRESET.bioneer   : 50 mM Na+, Mg 0, 250 nM 올리고 (사용자 표준, 15 nt 미만은 Wallace)
 *  - PRESET.primerdigital : 55 mM Na+, 1 mM Mg2+, 200 nM 올리고 (primerdigital.com 비교용)
 *
 * 사용: const { tm, PRESET } = require('./tm'); tm('ACGT...', PRESET.bioneer)
 */

// SantaLucia 1998 unified NN parameters: ΔH (kcal/mol), ΔS (cal/mol·K), 5'→3' / 3'←5'
const NN = {
  AA: [-7.9, -22.2], TT: [-7.9, -22.2],
  AT: [-7.2, -20.4], TA: [-7.2, -21.3],
  CA: [-8.5, -22.7], TG: [-8.5, -22.7],
  GT: [-8.4, -22.4], AC: [-8.4, -22.4],
  CT: [-7.8, -21.0], AG: [-7.8, -21.0],
  GA: [-8.2, -22.2], TC: [-8.2, -22.2],
  CG: [-10.6, -27.2], GC: [-9.8, -24.4],
  GG: [-8.0, -19.9], CC: [-8.0, -19.9],
};
// 개시 항 (말단 염기쌍 종류별)
const INIT_GC = [0.1, -2.8];
const INIT_AT = [2.3, 4.1];
const SYM_DS = -1.4; // 자기상보 서열 엔트로피 보정
const R = 1.9872;    // cal/(mol·K)

const PRESET = {
  bioneer:       { na: 0.050, mg: 0.0,   oligo_uM: 0.25, wallaceBelow: 15 },
  primerdigital: { na: 0.055, mg: 0.001, oligo_uM: 0.20, wallaceBelow: 0 },
};

function clean(seq) {
  return String(seq).toUpperCase().replace(/[^ACGT]/g, '');
}
function revcomp(s) {
  const c = { A: 'T', T: 'A', C: 'G', G: 'C' };
  return s.split('').reverse().map(b => c[b]).join('');
}
function gcFraction(s) {
  let n = 0;
  for (const b of s) if (b === 'G' || b === 'C') n++;
  return n / s.length;
}
function wallace(s) {
  let at = 0, gc = 0;
  for (const b of s) (b === 'A' || b === 'T') ? at++ : gc++;
  return 2 * at + 4 * gc;
}

/** 1 M Na+ 기준 ΔH, ΔS 합산 */
function thermo(s) {
  let dH = 0, dS = 0;
  const ends = [s[0], s[s.length - 1]];
  for (const e of ends) {
    const [h, sE] = (e === 'G' || e === 'C') ? INIT_GC : INIT_AT;
    dH += h; dS += sE;
  }
  if (s === revcomp(s)) dS += SYM_DS;
  for (let i = 0; i < s.length - 1; i++) {
    const [h, sE] = NN[s.slice(i, i + 2)];
    dH += h; dS += sE;
  }
  return { dH, dS };
}

/**
 * Tm (°C). opts: { na (M), mg (M), oligo_uM, wallaceBelow }
 * 비자기상보 이중가닥 가정: Ct/4 사용.
 */
function tm(seq, opts = PRESET.bioneer) {
  const s = clean(seq);
  const N = s.length;
  if (N < 2) return NaN;
  if (N < (opts.wallaceBelow || 0)) return wallace(s);

  const { dH, dS } = thermo(s);
  const ct = (opts.oligo_uM * 1e-6) / 4;
  let invTm = (dS + R * Math.log(ct)) / (dH * 1000); // 1/K (1 M Na+)

  const fGC = gcFraction(s);
  const na = opts.na;
  const mg = opts.mg || 0;
  const lnNa = Math.log(na);
  const ratio = na > 0 ? Math.sqrt(mg) / na : Infinity;

  if (mg <= 0 || ratio < 0.22) {
    // Owczarzy 2004: 1가 양이온 보정
    invTm += (4.29 * fGC - 3.95) * 1e-5 * lnNa + 9.40e-6 * lnNa * lnNa;
  } else {
    // Owczarzy 2008: Mg2+ 보정 (0.22 ≤ R < 6 이면 Na+ 경쟁 계수 적용)
    let a = 3.92e-5, b = -9.11e-6, c = 6.26e-5, d = 1.42e-5,
        e = -4.82e-4, f = 5.25e-4, g = 8.31e-5;
    if (ratio < 6) {
      a *= 0.843 - 0.352 * Math.sqrt(na) * lnNa;
      d *= 1.279 - 4.03e-3 * lnNa - 8.03e-3 * lnNa * lnNa;
      g *= 0.486 - 0.258 * lnNa + 5.25e-3 * lnNa * lnNa * lnNa;
    }
    const lnMg = Math.log(mg);
    invTm += a + b * lnMg + fGC * (c + d * lnMg)
           + (1 / (2 * (N - 1))) * (e + f * lnMg + g * lnMg * lnMg);
  }
  return 1 / invTm - 273.15;
}

module.exports = { tm, PRESET, thermo, gcFraction, wallace, revcomp, clean, NN };

// ---- 셀프 테스트 ----
if (require.main === module) {
  const tests = [
    'GAAGGTGACCAAGTTCATGCT',          // FAM tail (21 nt)
    'GAAGGTCGGAGTCAACGGATT',          // HEX tail (21 nt)
    'ATGCATGCATGCATGCATGC',           // 20 nt
    'GCGCGCGCGCGCGCGCGCGC',           // GC-rich 20 nt
    'AATTAATTAATTAATTAATT',           // AT-rich 20 nt
    'ACGTACGTAC',                     // 10 nt → bioneer=Wallace
  ];
  console.log('seq\tlen\tGC%\tTm_bioneer\tTm_primerdigital');
  for (const s of tests) {
    console.log([s, s.length, (gcFraction(s) * 100).toFixed(0),
      tm(s, PRESET.bioneer).toFixed(1), tm(s, PRESET.primerdigital).toFixed(1)].join('\t'));
  }
}
