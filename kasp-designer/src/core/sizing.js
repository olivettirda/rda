/**
 * sizing.js — Allele sizing 모드 (겔 판독, 사양 §7)
 *
 *  - tail 대신 5′ filler 를 붙여 대립유전자별 산물 길이를 bandStep 간격 사다리로 만든다
 *  - filler 는 6개 후보(결정론적 생성) 중 모든 프라이머와 다이머가 가장 적은 것을 고른다
 *  - 옵션 "second deliberate mismatch": 3′ 에서 2번째 염기(모든 ASP 가 같을 때만)를 상보 염기로 치환
 *  - 최장 프라이머가 maxLen(기본 45) 초과 시 경고
 */
import { complementSeq, applyCase } from './seq.js';
import { meltingTemp } from './tm.js';
import { findDimer, findSelfDimer } from './dimer.js';
import { findSimpleRepeat } from './complexity.js';

export const BAND_STEPS = Object.freeze({
  agarose: Object.freeze({ key: 'agarose', label: '아가로스', step: 20 }),
  page: Object.freeze({ key: 'page', label: 'PAGE', step: 5 }),
  ce: Object.freeze({ key: 'ce', label: '모세관 전기영동 (CE)', step: 2 }),
});

/** 결정론적 의사난수 (LCG) — 매번 같은 filler 후보를 만든다 */
function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hasRun(seq, n = 4) {
  return new RegExp(`(A{${n}}|C{${n}}|G{${n}}|T{${n}})`).test(seq);
}

/** 길이 len 의 filler 후보 count 개 생성 (GC 45–55 %, 4연속 염기·단순반복·자기 다이머 없음) */
export function generateFillers(count = 6, len = 60, seed = 20251021) {
  const rnd = lcg(seed);
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 20000) {
    let s = '';
    for (let i = 0; i < len; i++) s += 'ACGT'[Math.floor(rnd() * 4)];
    const gc = Array.from(s).filter((b) => b === 'G' || b === 'C').length / len;
    if (gc < 0.45 || gc > 0.55) continue;
    if (hasRun(s, 4) || findSimpleRepeat(s)) continue;
    const self = findSelfDimer(s, { threshold: 7 });
    if (self && self.isDimer) continue;
    if (out.some((o) => { const r = findDimer(o, s, { threshold: 7 }); return r && r.isDimer; })) continue;
    out.push(s);
  }
  return out;
}

export const FILLERS = Object.freeze(generateFillers(6, 60));

function dimerScore(oligo, others, threshold) {
  let score = 0;
  const self = findSelfDimer(oligo, { threshold });
  if (self) score += self.matches;
  for (const o of others) {
    const r = findDimer(oligo, o, { threshold });
    if (r) score += r.matches;
  }
  return score;
}

/**
 * 한 세트(ASP 들 + 선택한 Common)에 filler 를 붙여 사다리 산물을 만든다.
 * ASP 는 design.js 의 ASP 객체(tail 없음)여야 한다. 원본은 변경하지 않고 새 ASP 배열을 돌려준다.
 *
 * @param {object} set designStrand 결과
 * @param {object} common 선택한 Common 후보
 * @param {object} o { bandStep:number, secondMismatch:boolean, maxLen:number, dimerThreshold:number, cond }
 * @returns {{ asps:object[], products:object[], filler:string|null, warnings:string[] }}
 */
export function applyAlleleSizing(set, common, o = {}) {
  const bandStep = o.bandStep ?? 20;
  const maxLen = o.maxLen ?? 45;
  const threshold = o.dimerThreshold ?? 7;
  const warnings = [];
  const base = (set.asps || []).filter(Boolean).map((a) => ({ ...a, warnings: [...a.warnings] }));
  if (!base.length) return { asps: [], products: [], filler: null, warnings: ['ASP 가 없습니다.'] };

  // 1. deliberate mismatch (3′ 에서 2번째)
  if (o.secondMismatch) {
    const idx = base.map((a) => a.body.length - 2);
    const bases = base.map((a, i) => a.body[idx[i]]);
    if (bases.every((b) => b === bases[0])) {
      for (let i = 0; i < base.length; i++) {
        const a = base[i];
        const k = idx[i];
        const nb = complementSeq(a.body[k]);
        const body = a.body.slice(0, k) + nb + a.body.slice(k + 1);
        const upperStart = Math.max(0, set.template.s1.length - a.start0);
        const upperEnd = Math.min(a.length, upperStart + a.allele.length);
        a.body = body;
        a.bodyDisplay = applyCase(body, upperStart, upperEnd);
        a.mismatchPos = k;
        a.tm = meltingTemp(body, o.cond);
        a.warnings.push(`3′ 2번째 염기 ${a.body[k] === nb ? bases[i] + '→' + nb : ''} 의도적 미스매치 적용 (Tm 은 완전 일치 가정값)`);
      }
    } else {
      warnings.push('ASP 들의 3′ 2번째 염기가 서로 달라 의도적 미스매치를 적용하지 않았습니다.');
    }
  }

  // 2. 산물 길이 (filler 없이)
  const S = set.template.s3Offset; // allele-0 기준 s3 시작
  const alleleLens = set.template.alleles.map((a) => a.seq.length);
  const products = base.map((a) => {
    const Si = set.template.s1.length + alleleLens[a.alleleIndex];
    const right = common ? Si + common.pos + common.length : Si;
    return { id: a.id, label: a.alleleLabel, bare: right - a.start0, alleleIndex: a.alleleIndex };
  });
  void S;

  // 3. 사다리 목표: 가장 짧은 산물부터 bandStep 간격
  const order = products.map((p, i) => i).sort((x, y) => products[x].bare - products[y].bare);
  const shortest = products[order[0]].bare;
  const need = new Array(base.length).fill(0);
  order.forEach((idx, rank) => {
    const target = shortest + rank * bandStep;
    need[idx] = Math.max(0, target - products[idx].bare);
  });

  // 4. filler 후보 선택
  const others = [...(common ? [common.seqUpper] : [])];
  let bestFiller = null, bestScore = Infinity;
  for (const cand of FILLERS) {
    const oligos = base.map((a, i) => cand.slice(cand.length - need[i]) + a.body.toUpperCase());
    let score = 0;
    for (let i = 0; i < oligos.length; i++) {
      score += dimerScore(oligos[i], [...others, ...oligos.filter((_, j) => j !== i)], threshold);
    }
    if (score < bestScore) { bestScore = score; bestFiller = cand; }
    if (score === 0) break;
  }

  // 5. 적용
  const asps = base.map((a, i) => {
    const filler = bestFiller ? bestFiller.slice(bestFiller.length - need[i]) : '';
    const tail = filler.length ? { name: 'Filler', seq: filler } : null;
    const full = filler + a.bodyDisplay;
    const out = {
      ...a,
      tail, full, fullUpper: full.toUpperCase(), fullLength: full.length,
      oligoForDimer: full,
      product: products[i].bare + filler.length,
    };
    if (full.length > maxLen) out.warnings.push(`프라이머 길이 ${full.length} nt 가 최대 ${maxLen} nt 초과`);
    return out;
  });
  if (asps.some((a) => a.fullLength > maxLen)) warnings.push(`filler 를 붙인 ASP 가 ${maxLen} nt 를 넘습니다. 간격(bandStep)을 줄이거나 다른 Common 을 선택하세요.`);
  if (!common) warnings.push('Common 프라이머가 없어 산물 길이를 계산할 수 없습니다.');

  return {
    asps,
    products: asps.map((a) => ({ id: a.id, label: a.alleleLabel, size: a.product })),
    filler: bestFiller,
    fillerScore: bestScore,
    warnings,
  };
}
