/**
 * parse.js — FASTA / 대괄호 변이 마크업 파서 (사양 §1)
 *
 *  >이름
 *  acgt...[A/G]...acgt         이중대립
 *  [A/C/G/T] 다중대립, [R] IUPAC 1문자, [AG/] 또는 [AG/-] InDel, [GATATAC/CAGTCC] MNV
 *  괄호 밖 IUPAC(r, y ...) = 주변 SNP → 마스킹 위치로 기록
 *  /.../ = 프라이머 배치 금지 구역
 *  헤더 없는 서열은 Seq1, Seq2 … ; "이름<공백>서열" 한 줄 형식도 허용
 */
import { normalizeBase, expandIupac, isAcgt, IUPAC_SETS } from './seq.js';

/** 서열/마크업으로만 이루어진 토큰인지 (이름 토큰과 구분) */
const SEQ_LIKE_TOKEN = /^[acgturyswkmbdhvn\[\]\/\-\.]+$/i;
const CHR_POS_RE = /\b(chr\w*?)\s*[:：]\s*(\d[\d,]*)/i;

/** 염기 집합 → IUPAC 1문자 (예: {A,G} → R) */
export function basesToIupac(bases) {
  const key = Array.from(new Set(bases.map((b) => normalizeBase(b)).filter(Boolean))).sort().join('');
  for (const [code, set] of Object.entries(IUPAC_SETS)) {
    if (Array.from(set).sort().join('') === key) return code;
  }
  return 'N';
}

/** 괄호 안 내용 → 대립유전자 목록 */
export function parseAlleles(content) {
  const raw = String(content ?? '');
  const parts = raw.includes('/') ? raw.split('/') : [raw];
  const cleanPart = (p) => {
    let out = '';
    for (const ch of p) {
      const b = normalizeBase(ch);
      if (b) out += b;
    }
    return out; // '-' 나 공백은 제거 → 결실은 ''
  };
  let alleles = [];
  if (parts.length === 1) {
    const p = cleanPart(parts[0]);
    if (!p.length) return { error: '괄호 안에 대립유전자가 없습니다.' };
    alleles = expandIupac(p);
  } else {
    for (const part of parts) alleles.push(...expandIupac(cleanPart(part)));
  }
  const seen = new Set();
  alleles = alleles.filter((a) => (seen.has(a) ? false : (seen.add(a), true)));
  if (alleles.length < 2) return { error: `대립유전자가 2개 이상이어야 합니다: [${raw}]` };
  if (alleles.length > 64) return { error: `대립유전자 조합이 너무 많습니다(${alleles.length}개): [${raw}]` };
  return { alleles: alleles.map((seq) => ({ seq, label: seq === '' ? 'del' : seq })) };
}

/**
 * 한 레코드의 서열 본문을 파싱해 s1 / alleles / s3 와 마스킹 정보를 만든다.
 */
export function parseMarkup(seqText) {
  const text = String(seqText ?? '');
  const flanks = ['', ''];           // [s1, s3]
  const iupac = [[], []];
  const excluded = [[], []];
  const variants = [[], []];
  const warnings = [];
  let side = 0;                      // 0 = s1, 1 = s3
  let alleles = null;
  let inExcluded = false;
  let exclStart = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '[') {
      const close = text.indexOf(']', i + 1);
      if (close < 0) return { error: '닫히지 않은 대괄호 [ 가 있습니다.' };
      const content = text.slice(i + 1, close);
      i = close;
      const parsed = parseAlleles(content);
      if (parsed.error) return { error: parsed.error };
      if (!alleles) {
        alleles = parsed.alleles;
        if (inExcluded) {            // 제외구역이 변이를 가로지르면 s1 쪽을 닫고 s3 에서 다시 연다
          excluded[0].push([exclStart, flanks[0].length]);
          exclStart = 0;
        }
        side = 1;
      } else {
        const seqs = parsed.alleles.map((a) => a.seq);
        const allSingle = seqs.every((s) => s.length === 1);
        const at = flanks[side].length;
        if (allSingle) {
          flanks[side] += basesToIupac(seqs);
          iupac[side].push(at);
        } else {
          const longest = seqs.reduce((a, b) => (b.length > a.length ? b : a), seqs[0]);
          flanks[side] += longest;
          variants[side].push([at, at + longest.length]);
        }
        warnings.push(`두 번째 이후 괄호 [${content}] 는 주변 변이로 취급해 프라이머가 덮지 않도록 마스킹했습니다.`);
      }
      continue;
    }
    if (ch === ']') continue;
    if (ch === '/') {
      if (!inExcluded) { inExcluded = true; exclStart = flanks[side].length; }
      else { inExcluded = false; excluded[side].push([exclStart, flanks[side].length]); }
      continue;
    }
    const b = normalizeBase(ch);
    if (!b) continue;
    if (!isAcgt(b)) iupac[side].push(flanks[side].length);
    flanks[side] += b;
  }
  if (inExcluded) warnings.push('짝이 맞지 않는 / 가 있어 마지막 제외구역은 무시했습니다.');
  if (!alleles) return { error: '대괄호 [ ] 로 표시한 변이가 없습니다. 예: acgt[A/G]acgt' };
  return {
    s1: flanks[0], s3: flanks[1], alleles,
    iupacS1: iupac[0], iupacS3: iupac[1],
    excludedS1: excluded[0], excludedS3: excluded[1],
    variantS1: variants[0], variantS3: variants[1],
    warnings,
  };
}

/** 헤더 문자열에서 Chr:bp 좌표 추출 */
export function parseChrPos(header) {
  const m = CHR_POS_RE.exec(String(header ?? ''));
  if (!m) return null;
  return { chr: m[1], pos: Number(m[2].replace(/,/g, '')) };
}

/**
 * 전체 입력 텍스트 → 레코드 목록
 * @returns {{ records: object[], errors: string[] }}
 */
export function parseInput(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  const raws = [];
  let current = null;
  let autoCount = 0;

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('>')) {
      current = { header: t.slice(1).trim(), lines: [], auto: false };
      raws.push(current);
      continue;
    }
    if (t === '') {
      if (current && current.auto) current = null; // 빈 줄은 무명 레코드를 끝낸다
      continue;
    }
    if (t.startsWith('#') || t.startsWith(';')) continue;
    const tokens = t.split(/\s+/);
    if (tokens.length >= 2 && !SEQ_LIKE_TOKEN.test(tokens[0])) {
      current = { header: tokens[0], lines: [tokens.slice(1).join('')], auto: true };
      raws.push(current);
      continue;
    }
    if (!current) {
      autoCount++;
      current = { header: null, lines: [], auto: true, autoName: `Seq${autoCount}` };
      raws.push(current);
    }
    current.lines.push(t);
  }

  const records = [];
  const errors = [];
  for (const raw of raws) {
    const header = raw.header ?? '';
    const name = raw.header ? header.split(/\s+/)[0] : raw.autoName ?? `Seq${++autoCount}`;
    const body = raw.lines.join('');
    const parsed = parseMarkup(body);
    const rec = { name, header, chrPos: parseChrPos(header), raw: body };
    if (parsed.error) {
      rec.error = parsed.error;
      errors.push(`${name}: ${parsed.error}`);
    } else {
      Object.assign(rec, parsed);
      rec.length = rec.s1.length + rec.alleles[0].seq.length + rec.s3.length;
    }
    records.push(rec);
  }
  if (!records.length) errors.push('서열이 없습니다.');
  return { records, errors };
}

/** 레코드 요약 (UI 표시용) */
export function summarizeRecords(records) {
  const ok = records.filter((r) => !r.error);
  const nt = ok.reduce((a, r) => a + r.length, 0);
  return { count: records.length, ok: ok.length, nt };
}
