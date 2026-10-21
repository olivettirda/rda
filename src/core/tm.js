/**
 * tm.js — 올리고 Tm 계산 (클린룸 구현)
 *
 * 문헌
 *  - SantaLucia J. (1998) PNAS 95:1460–1465 : 통합 최근접이웃(NN) ΔH/ΔS, 개시 항, 자기상보 보정
 *  - Owczarzy R. et al. (2004) Biochemistry 43:3537–3554 : 1가 양이온(Na+) 보정
 *  - Owczarzy R. et al. (2008) Biochemistry 47:5336–5353 : Mg2+ 보정, R = sqrt[Mg]/[Na] 분기
 *  - Wallace rule (Wallace et al. 1979 NAR 6:3543) : 짧은 올리고 Tm = 2(A+T) + 4(G+C)
 *
 * 절대 규칙(사양 §3.4): Tm 은 tail 을 제거한 본체 서열로만 계산한다.
 * 이 모듈은 받은 서열을 그대로 계산할 뿐이므로, 호출 측(design.js)이 tail 을 떼고 넘긴다.
 */
import { gcFraction } from './seq.js';

export const GAS_CONSTANT = 1.9872; // cal/(mol·K)

/** SantaLucia 1998 통합 NN 파라미터: 5'→3' 이량체 → [ΔH kcal/mol, ΔS cal/(mol·K)] */
export const NN_SANTALUCIA_1998 = Object.freeze({
  AA: [-7.9, -22.2], TT: [-7.9, -22.2],
  AT: [-7.2, -20.4],
  TA: [-7.2, -21.3],
  CA: [-8.5, -22.7], TG: [-8.5, -22.7],
  GT: [-8.4, -22.4], AC: [-8.4, -22.4],
  CT: [-7.8, -21.0], AG: [-7.8, -21.0],
  GA: [-8.2, -22.2], TC: [-8.2, -22.2],
  CG: [-10.6, -27.2],
  GC: [-9.8, -24.4],
  GG: [-8.0, -19.9], CC: [-8.0, -19.9],
});
/** 개시 항: 말단 염기쌍이 G·C / A·T 일 때 (각 말단에 한 번씩) */
export const INIT_TERMINAL_GC = Object.freeze([0.1, -2.8]);
export const INIT_TERMINAL_AT = Object.freeze([2.3, 4.1]);
/** 자기상보(palindrome) 서열의 엔트로피 보정 */
export const SYMMETRY_DS = -1.4;

/** 조건 프리셋 (UI 표시용 단위: mM, nM) — 사양 §3.3 */
export const TM_PRESETS = Object.freeze({
  bioneer: Object.freeze({
    key: 'bioneer', label: '바이오니어',
    na_mM: 50, mg_mM: 0, oligo_nM: 250, wallaceBelow: 15,
  }),
  primerdigital: Object.freeze({
    key: 'primerdigital', label: 'primerdigital',
    na_mM: 55, mg_mM: 1, oligo_nM: 200, wallaceBelow: 0,
  }),
});

/**
 * 프리셋/사용자 입력(mM, nM)을 계산용 조건(M)으로 변환.
 * @returns {{na:number, mg:number, ct:number, wallaceBelow:number}}
 */
export function makeConditions(input = TM_PRESETS.bioneer) {
  const na_mM = Number(input.na_mM ?? 50);
  const mg_mM = Number(input.mg_mM ?? 0);
  const oligo_nM = Number(input.oligo_nM ?? 250);
  const wallaceBelow = Number(input.wallaceBelow ?? 0);
  return {
    na: Math.max(0, na_mM) / 1000,
    mg: Math.max(0, mg_mM) / 1000,
    ct: Math.max(1e-12, oligo_nM) * 1e-9,
    wallaceBelow: Number.isFinite(wallaceBelow) ? wallaceBelow : 0,
  };
}

export const DEFAULT_CONDITIONS = Object.freeze(makeConditions(TM_PRESETS.bioneer));

/** 계산용: 대문자 ACGT 만 남김 (U→T, 모호 염기 제거) */
export function strictBases(seq) {
  let out = '';
  for (const raw of String(seq ?? '')) {
    let b = raw.toUpperCase();
    if (b === 'U') b = 'T';
    if (b === 'A' || b === 'C' || b === 'G' || b === 'T') out += b;
  }
  return out;
}

/** Wallace rule: 2(A+T) + 4(G+C) */
export function wallaceTm(seq) {
  const s = strictBases(seq);
  let weak = 0, strong = 0;
  for (const b of s) {
    if (b === 'A' || b === 'T') weak++;
    else strong++;
  }
  return 2 * weak + 4 * strong;
}

function isPalindromic(s) {
  const n = s.length;
  const comp = { A: 'T', T: 'A', C: 'G', G: 'C' };
  for (let i = 0; i < n; i++) {
    if (comp[s[i]] !== s[n - 1 - i]) return false;
  }
  return true;
}

/**
 * 1 M Na+ 기준 ΔH(kcal/mol), ΔS(cal/mol·K) 합계.
 * 개시 항은 양 말단 각각, 자기상보면 ΔS 에 SYMMETRY_DS 추가.
 */
export function nearestNeighborSums(seq) {
  const s = strictBases(seq);
  let dH = 0, dS = 0;
  if (s.length < 2) return { dH: NaN, dS: NaN };
  for (const terminal of [s[0], s[s.length - 1]]) {
    const [h, e] = (terminal === 'G' || terminal === 'C') ? INIT_TERMINAL_GC : INIT_TERMINAL_AT;
    dH += h;
    dS += e;
  }
  if (isPalindromic(s)) dS += SYMMETRY_DS;
  for (let i = 0; i + 1 < s.length; i++) {
    const [h, e] = NN_SANTALUCIA_1998[s[i] + s[i + 1]];
    dH += h;
    dS += e;
  }
  return { dH, dS };
}

/**
 * 염 보정: 1/Tm(1 M Na+) 에 더할 항을 반환 (단위 1/K).
 * - Mg 없음 또는 sqrt[Mg]/[Na] < 0.22 → Owczarzy 2004 (1가 양이온)
 * - 그 외 → Owczarzy 2008 (Mg2+), ratio < 6 이면 a, d, g 에 Na 경쟁 보정
 */
export function saltCorrectionTerm({ fGC, length, na, mg }) {
  const n = length;
  const useMonovalent = mg <= 0 || (na > 0 && Math.sqrt(mg) / na < 0.22);
  if (useMonovalent) {
    if (na <= 0) return 0; // 양이온이 전혀 없으면 보정 불가 → 1 M 기준값 유지
    const lnNa = Math.log(na);
    return (4.29 * fGC - 3.95) * 1e-5 * lnNa + 9.40e-6 * lnNa * lnNa;
  }
  let a = 3.92e-5, b = -9.11e-6, c = 6.26e-5, d = 1.42e-5;
  let e = -4.82e-4, f = 5.25e-4, g = 8.31e-5;
  if (na > 0) {
    const ratio = Math.sqrt(mg) / na;
    if (ratio < 6) {
      const lnNa = Math.log(na);
      a *= 0.843 - 0.352 * Math.sqrt(na) * lnNa;
      d *= 1.279 - 4.03e-3 * lnNa - 8.03e-3 * lnNa * lnNa;
      g *= 0.486 - 0.258 * lnNa + 5.25e-3 * lnNa * lnNa * lnNa;
    }
  }
  const lnMg = Math.log(mg);
  return a + b * lnMg + fGC * (c + d * lnMg)
    + (1 / (2 * (n - 1))) * (e + f * lnMg + g * lnMg * lnMg);
}

/**
 * 올리고 Tm (°C). 비자기상보 이중가닥 가정(Ct/4).
 * 길이 < wallaceBelow 이면 Wallace rule. 길이 < 2 이면 NaN.
 */
export function meltingTemp(seq, cond = DEFAULT_CONDITIONS) {
  const s = strictBases(seq);
  const n = s.length;
  if (n < 2) return NaN;
  if (n < (cond.wallaceBelow || 0)) return wallaceTm(s);

  const { dH, dS } = nearestNeighborSums(s);
  const ctQuarter = cond.ct / 4;
  let invTm = (dS + GAS_CONSTANT * Math.log(ctQuarter)) / (dH * 1000);
  invTm += saltCorrectionTerm({ fGC: gcFraction(s), length: n, na: cond.na, mg: cond.mg });
  return 1 / invTm - 273.15;
}

/**
 * Amplicon(긴 이중가닥) Tm — 정보용 (사양 §3.5)
 * Tm = 77.1 + 11.7·log10(Na') + 41·(G+C)/N − 528/N,  Na' = [Na] + 3.795·sqrt[Mg] (M)
 */
export function ampliconTm(seq, cond = DEFAULT_CONDITIONS) {
  const s = strictBases(seq);
  const n = s.length;
  if (n < 1) return NaN;
  let gc = 0;
  for (const b of s) if (b === 'G' || b === 'C') gc++;
  const naEff = cond.na + 3.795 * Math.sqrt(cond.mg || 0);
  if (naEff <= 0) return NaN;
  return 77.1 + 11.7 * Math.log10(naEff) + 41 * (gc / n) - 528 / n;
}

/** 소수 1자리 문자열 */
export function formatTm(x) {
  return Number.isFinite(x) ? x.toFixed(1) : '–';
}
