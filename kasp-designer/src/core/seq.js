/**
 * seq.js — 서열 정제, 상보/역상보, IUPAC 전개, GC% 계산
 *
 * 참고 문헌: IUPAC 핵산 코드 (Cornish-Bowden A. 1985, Nucleic Acids Res 13:3021)
 * 외부 코드와 무관한 클린룸 구현.
 */

/** IUPAC 1문자 → 가능한 염기 집합 */
export const IUPAC_SETS = Object.freeze({
  A: 'A', C: 'C', G: 'G', T: 'T',
  R: 'AG', Y: 'CT', S: 'CG', W: 'AT', K: 'GT', M: 'AC',
  B: 'CGT', D: 'AGT', H: 'ACT', V: 'ACG', N: 'ACGT',
});

const COMPLEMENT = Object.freeze({
  A: 'T', C: 'G', G: 'C', T: 'A',
  R: 'Y', Y: 'R', S: 'S', W: 'W', K: 'M', M: 'K',
  B: 'V', V: 'B', D: 'H', H: 'D', N: 'N',
});

/** GC 가중치 (사양 §4.2): S/G/C=1, R/Y/K/M/N=0.5, B/V=2/3, D/H=1/3, A/T/W=0 */
const GC_WEIGHT = Object.freeze({
  G: 1, C: 1, S: 1,
  R: 0.5, Y: 0.5, K: 0.5, M: 0.5, N: 0.5,
  B: 2 / 3, V: 2 / 3, D: 1 / 3, H: 1 / 3,
  A: 0, T: 0, W: 0,
});

/** 한 글자를 정규화: 대문자화, U→T, 허용되지 않는 문자는 '' */
export function normalizeBase(ch) {
  let b = String(ch).toUpperCase();
  if (b === 'U') b = 'T';
  return Object.prototype.hasOwnProperty.call(IUPAC_SETS, b) ? b : '';
}

/** 텍스트에서 허용 염기(ACGTU + IUPAC)만 남긴 대문자 서열 */
export function cleanSeq(text) {
  let out = '';
  for (const raw of String(text ?? '')) {
    const b = normalizeBase(raw);
    if (b) out += b;
  }
  return out;
}

export function isAcgt(ch) {
  const b = String(ch).toUpperCase();
  return b === 'A' || b === 'C' || b === 'G' || b === 'T';
}

/** 모호 염기(IUPAC, ACGT 이외)가 하나라도 있으면 true */
export function hasAmbiguity(seq) {
  for (const ch of String(seq)) if (!isAcgt(ch)) return true;
  return false;
}

/** 모호 염기 위치 목록 (0-based) */
export function ambiguityPositions(seq) {
  const out = [];
  const s = String(seq);
  for (let i = 0; i < s.length; i++) if (!isAcgt(s[i])) out.push(i);
  return out;
}

/** 상보 서열 (대소문자 보존, 미지 문자는 그대로) */
export function complementSeq(seq) {
  let out = '';
  for (const ch of String(seq)) {
    const up = ch.toUpperCase();
    const c = COMPLEMENT[up];
    if (!c) { out += ch; continue; }
    out += ch === up ? c : c.toLowerCase();
  }
  return out;
}

/** 역상보 서열 */
export function revcomp(seq) {
  return complementSeq(Array.from(String(seq)).reverse().join(''));
}

/**
 * IUPAC 전개: 'AR' → ['AA','AG'] 처럼 가능한 모든 조합(곱집합).
 * 빈 문자열은 [''] 로 전개된다(InDel의 결실 쪽).
 * limit 초과 시 앞에서부터 limit 개만 반환.
 */
export function expandIupac(seq, limit = 1024) {
  let combos = [''];
  for (const raw of String(seq)) {
    const b = normalizeBase(raw);
    if (!b) continue;
    const choices = IUPAC_SETS[b];
    const next = [];
    for (const prefix of combos) {
      for (const c of choices) {
        next.push(prefix + c);
        if (next.length >= limit) break;
      }
      if (next.length >= limit) break;
    }
    combos = next;
  }
  return combos;
}

/** GC 가중 비율 (0~1). 빈 서열이면 0 */
export function gcFraction(seq) {
  const s = String(seq);
  if (!s.length) return 0;
  let w = 0, n = 0;
  for (const ch of s) {
    const b = normalizeBase(ch);
    if (!b) continue;
    w += GC_WEIGHT[b];
    n++;
  }
  return n ? w / n : 0;
}

export function gcPercent(seq) {
  return gcFraction(seq) * 100;
}

export function baseCounts(seq) {
  const counts = { A: 0, C: 0, G: 0, T: 0, other: 0 };
  for (const ch of String(seq)) {
    const b = normalizeBase(ch);
    if (b === 'A' || b === 'C' || b === 'G' || b === 'T') counts[b]++;
    else counts.other++;
  }
  return counts;
}

/**
 * [upperStart, upperEnd) 구간만 대문자, 나머지는 소문자로 표기.
 * 사양 §5-3: 변이 구간 대문자, flank 소문자.
 */
export function applyCase(seq, upperStart, upperEnd) {
  const s = String(seq);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += (i >= upperStart && i < upperEnd) ? s[i].toUpperCase() : s[i].toLowerCase();
  }
  return out;
}

/**
 * Bisulfite 변환 (사양 §2.4): CpG 가 아닌 C → T.
 * nextChar 는 서열 끝 다음에 오는 염기(경계 판정용, 없으면 '').
 */
export function bisulfiteConvert(seq, nextChar = '') {
  const s = String(seq ?? '');
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    const up = ch.toUpperCase();
    if (up === 'C') {
      const next = (i + 1 < s.length ? s[i + 1] : nextChar).toUpperCase();
      if (next !== 'G') { out += ch === up ? 'T' : 't'; continue; }
    }
    out += ch;
  }
  return out;
}

/** 패턴 문자(IUPAC)가 염기를 포함하는지 ('N' 은 모두 허용) */
export function baseMatchesIupac(base, patternChar) {
  const b = normalizeBase(base);
  const p = normalizeBase(patternChar);
  if (!b || !p) return false;
  return IUPAC_SETS[p].includes(b);
}
