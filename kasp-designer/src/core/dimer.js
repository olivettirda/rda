/**
 * dimer.js — 5-mer 시드 기반 역평행 다이머(self/cross) 검사
 *
 * 사양 §4.3
 *  - 짧은 쪽 서열의 모든 5-mer 를 색인 → 긴 쪽의 역상보 가닥을 스캔해 시드 일치 탐색
 *  - 시드에서 양방향 확장, 미스매치 1개까지 허용, 상보 염기쌍 수를 센다
 *  - 상보쌍 수 ≥ threshold(기본 6) → 다이머 판정. 3′ 말단 관여 또는 ≥ 8 이면 가중치(정보용)
 */
import { revcomp } from './seq.js';

function onlyAcgtUpper(seq) {
  // 모호 염기는 '?' 로 바꿔 절대 일치하지 않게 한다 (길이는 보존)
  let out = '';
  for (const raw of String(seq ?? '')) {
    let b = raw.toUpperCase();
    if (b === 'U') b = 'T';
    out += (b === 'A' || b === 'C' || b === 'G' || b === 'T') ? b : '?';
  }
  return out;
}

/**
 * 한 대각선(offset) 위에서 ≤1 미스매치를 허용하는 최대 상보쌍 구간을 찾는다.
 * match[k] = true 이면 k번째 쌍이 상보.
 * 반환: { matches, start, end } (end 는 exclusive), 시드 길이 이상의 연속 일치가 없으면 null
 */
function bestSegmentOnDiagonal(match, seedLen) {
  const n = match.length;
  let best = null;
  let left = 0, mismatches = 0;
  for (let right = 0; right < n; right++) {
    if (!match[right]) mismatches++;
    while (mismatches > 1) {
      if (!match[left]) mismatches--;
      left++;
    }
    let run = 0, maxRun = 0, matches = 0;
    for (let k = left; k <= right; k++) {
      if (match[k]) { run++; matches++; if (run > maxRun) maxRun = run; }
      else run = 0;
    }
    if (maxRun < seedLen) continue;
    if (!best || matches > best.matches) best = { matches, start: left, end: right + 1 };
  }
  if (best) {
    while (best.start < best.end && !match[best.start]) best.start++;
    while (best.end > best.start && !match[best.end - 1]) best.end--;
  }
  return best;
}

/**
 * 두 프라이머(5'→3')의 가장 강한 역평행 상보 정렬을 찾는다.
 * @returns {{ isDimer:boolean, matches:number, span:number, score:number,
 *             threePrimeA:boolean, threePrimeB:boolean,
 *             aStart:number, aEnd:number, bStart:number, bEnd:number } | null}
 */
export function findDimer(seqA, seqB, options = {}) {
  const threshold = options.threshold ?? 6;
  const seedLen = options.seed ?? 5;
  const a = onlyAcgtUpper(seqA);
  const b = onlyAcgtUpper(seqB);
  if (a.length < seedLen || b.length < seedLen) return null;

  // 짧은 쪽을 색인, 긴 쪽의 역상보를 스캔
  const swapped = a.length > b.length;
  const short = swapped ? b : a;
  const long = swapped ? a : b;
  const longRc = revcomp(long).replace(/[^ACGT]/g, '?');

  const index = new Map();
  for (let i = 0; i + seedLen <= short.length; i++) {
    const kmer = short.slice(i, i + seedLen);
    if (kmer.includes('?')) continue;
    if (!index.has(kmer)) index.set(kmer, []);
    index.get(kmer).push(i);
  }

  const seenDiagonals = new Set();
  let best = null;
  for (let j = 0; j + seedLen <= longRc.length; j++) {
    const kmer = longRc.slice(j, j + seedLen);
    const hits = index.get(kmer);
    if (!hits) continue;
    for (const i of hits) {
      const diag = j - i; // longRc 위치 = short 위치 + diag
      if (seenDiagonals.has(diag)) continue;
      seenDiagonals.add(diag);
      const iStart = Math.max(0, -diag);
      const iEnd = Math.min(short.length, longRc.length - diag);
      const match = [];
      for (let k = iStart; k < iEnd; k++) match.push(short[k] !== '?' && short[k] === longRc[k + diag]);
      const seg = bestSegmentOnDiagonal(match, seedLen);
      if (!seg) continue;
      const sStart = iStart + seg.start, sEnd = iStart + seg.end;      // short 좌표
      const rStart = sStart + diag, rEnd = sEnd + diag;                 // longRc 좌표
      const lStart = long.length - rEnd, lEnd = long.length - rStart;    // long 좌표
      const threePrimeShort = sEnd === short.length;
      const threePrimeLong = lEnd === long.length;
      const cand = {
        matches: seg.matches,
        span: seg.end - seg.start,
        aStart: swapped ? lStart : sStart, aEnd: swapped ? lEnd : sEnd,
        bStart: swapped ? sStart : lStart, bEnd: swapped ? sEnd : lEnd,
        threePrimeA: swapped ? threePrimeLong : threePrimeShort,
        threePrimeB: swapped ? threePrimeShort : threePrimeLong,
      };
      cand.score = cand.matches + (cand.threePrimeA || cand.threePrimeB ? 2 : 0) + (cand.matches >= 8 ? 1 : 0);
      cand.isDimer = cand.matches >= threshold;
      if (!best || cand.score > best.score || (cand.score === best.score && cand.matches > best.matches)) best = cand;
    }
  }
  return best;
}

/** 자기 다이머 */
export function findSelfDimer(seq, options = {}) {
  return findDimer(seq, seq, options);
}

export function isDimer(seqA, seqB, options = {}) {
  const r = findDimer(seqA, seqB, options);
  return !!(r && r.isDimer);
}

/**
 * 정렬 결과를 사람이 읽을 수 있는 3줄 텍스트로 (UI 툴팁용)
 */
export function formatDimer(seqA, seqB, result) {
  if (!result) return '';
  const a = String(seqA).toUpperCase();
  const b = String(seqB).toUpperCase();
  const bRev = Array.from(b).reverse().join('');
  // a 의 aStart 가 bRev 의 (b.length - bEnd) 와 정렬됨
  const offsetA = result.aStart;
  const offsetB = b.length - result.bEnd;
  const pad = Math.max(offsetA, offsetB);
  const lineA = ' '.repeat(pad - offsetA) + "5'-" + a + "-3'";
  const lineB = ' '.repeat(pad - offsetB) + "3'-" + bRev + "-5'";
  let bars = ' '.repeat(pad + 3);
  const comp = { A: 'T', T: 'A', C: 'G', G: 'C' };
  const width = Math.max(a.length + (pad - offsetA), bRev.length + (pad - offsetB));
  for (let x = 0; x < width; x++) {
    const ia = x - (pad - offsetA);
    const ib = x - (pad - offsetB);
    const ca = a[ia], cb = bRev[ib];
    bars += (ca && cb && comp[ca] === cb) ? '|' : ' ';
  }
  return [lineA, bars, lineB].join('\n');
}
