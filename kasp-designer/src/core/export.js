/**
 * export.js — 결과 표(TSV), KASP 세트 텍스트, 엑셀 시트 데이터 (사양 §8)
 *
 * 엑셀 파일 자체는 xlsx.js 의 자체 작성기(의존성 없음)로 만든다.
 */
import { TM_PRESETS } from './tm.js';
import { genomicCoord } from './design.js';
import { cropOf } from './crop.js';
import { SPECIFICITY_LABEL, describeSpecificity } from './specificity.js';

const f1 = (x) => (Number.isFinite(x) ? x.toFixed(1) : '');
const f0 = (x) => (Number.isFinite(x) ? String(Math.round(x)) : '');

function pickSet(result, which) {
  return which === 'reverse' ? result.reverse : result.forward;
}

/** Report 탭: 모든 후보 (ID, Sequence, Length, Tm, GC, LC) */
export function reportRows(results, which = 'forward', maxCommon = Infinity) {
  const rows = [];
  for (const res of results) {
    if (res.error) continue;
    const set = pickSet(res, which);
    if (!set) continue;
    for (const asp of set.asps) {
      if (!asp) continue;
      rows.push({ marker: res.name, id: asp.id, seq: asp.full, length: asp.fullLength, tm: asp.tm, gc: asp.gc, lc: asp.lc, note: asp.warnings.join('; ') });
    }
    set.commons.slice(0, maxCommon).forEach((c) => {
      rows.push({ marker: res.name, id: c.id, seq: c.seq, length: c.length, tm: c.tm, gc: c.gc, lc: c.lc, note: `${c.ampliconLabel} / ${f1(c.ampliconTm)}${c.warnings.length ? ' ; ' + c.warnings.join('; ') : ''}` });
    });
  }
  return rows;
}

export function toReportTsv(results, which = 'forward', maxCommon = Infinity) {
  const head = ['Marker', 'ID', 'Sequence(5′→3′)', 'Length', 'Tm(°C)', 'GC(%)', 'LC(%)', 'Note'];
  const lines = [head.join('\t')];
  for (const r of reportRows(results, which, maxCommon)) {
    lines.push([r.marker, r.id, r.seq, r.length, f1(r.tm), f1(r.gc), r.lc, r.note].join('\t'));
  }
  return lines.join('\n');
}

/** KASP Assay Sets 탭 텍스트 (사양 §8.2 형식) */
export function toSetsText(result, which = 'forward', commonCount = 3) {
  const set = pickSet(result, which);
  const title = which === 'reverse' ? 'KASP Reverse sets' : 'KASP Forward sets';
  const lines = [`[${title}] ${result.name}:`];
  if (!set) return lines.join('\n');
  for (const asp of set.asps) {
    if (!asp) continue;
    lines.push([asp.id, asp.full, asp.fullLength, f1(asp.tm), f1(asp.gc), asp.lc].join('\t'));
  }
  lines.push('');
  for (const c of set.commons.slice(0, commonCount)) {
    lines.push([c.id, c.seq, c.length, f1(c.tm), f1(c.gc), c.lc, `${c.amplicons.map((a) => a.size).join('/')}/${f1(c.ampliconTm)}`].join('\t'));
  }
  if (set.warnings.length) {
    lines.push('');
    for (const w of set.warnings) lines.push(`# ${w}`);
  }
  return lines.join('\n');
}

/** 선택한 세트(ASP 전부 + Common 1개)의 TSV (복사용) */
export function toSetTsv(result, which = 'forward', commonIndex = 0) {
  const set = pickSet(result, which);
  const head = ['ID', 'Sequence(5′→3′)', 'Length', 'Tm(°C)', 'GC(%)', 'LC(%)', 'Fragment_Size(bp)/Amplicon_Tm'];
  const lines = [head.join('\t')];
  if (!set) return lines.join('\n');
  for (const asp of set.asps) if (asp) lines.push([asp.id, asp.full, asp.fullLength, f1(asp.tm), f1(asp.gc), asp.lc, ''].join('\t'));
  const c = set.commons[commonIndex];
  if (c) lines.push([c.id, c.seq, c.length, f1(c.tm), f1(c.gc), c.lc, `${c.amplicons.map((a) => a.size).join('/')}/${f1(c.ampliconTm)}`].join('\t'));
  return lines.join('\n');
}

function conditionLabel(p) {
  if (p.preset === 'custom') return `사용자 정의 (Na⁺ ${p.custom.na_mM} mM, Mg²⁺ ${p.custom.mg_mM} mM, 올리고 ${p.custom.oligo_nM} nM)`;
  const t = TM_PRESETS[p.preset] || TM_PRESETS.bioneer;
  return `${t.label} (Na⁺ ${t.na_mM} mM, Mg²⁺ ${t.mg_mM} mM, 올리고 ${t.oligo_nM} nM${t.wallaceBelow ? `, <${t.wallaceBelow} nt Wallace` : ''})`;
}

/**
 * 엑셀 2시트 데이터 (AOA: 배열의 배열)
 *  - 주문용: Primer Name, Sequence 5'→3', Direction, Length, Purpose, Scale
 *  - 설계근거: 마커, ID, 위치 Chr:bp, Tm 조건, Tm, GC, LC, amplicon, 변환 전략, 비고
 * @param {object[]} results designAll 결과
 * @param {object} o { which:'forward'|'reverse'|'both', commonIndex, scale, selections: {name: {which, commonIndex}} }
 */
export function buildWorkbookData(results, o = {}) {
  const scale = o.scale || '25 nmol';
  const order = [['Primer Name', 'Sequence 5′→3′', 'Direction', 'Length', 'Purpose', 'Scale']];
  const basis = [['Marker', 'Primer ID', '작물 / 유전체', '위치 (Chr:bp)', '템플릿 위치', 'Tm 조건', 'Tm (°C, tail 제외)', 'GC (%)', 'LC (%)', 'Fragment (bp)', 'Amplicon Tm', '상동유전체 특이성', '변환 전략', '비고']];
  const specText = (pr) => (pr.specificity && pr.specificity.class !== 'unknown' ? `${SPECIFICITY_LABEL[pr.specificity.class]} — ${describeSpecificity(pr.specificity)}` : '');
  for (const res of results) {
    if (res.error) continue;
    const sel = (o.selections && o.selections[res.name]) || {};
    const which = sel.which || o.which || 'forward';
    const whichList = which === 'both' ? ['forward', 'reverse'] : [which];
    const crop = cropOf(res.params.cropMode);
    const cropText = crop.key === 'generic' ? '일반' : `${crop.label} (${crop.latin}) · ${crop.genome}`;
    for (const w of whichList) {
      const set = pickSet(res, w);
      if (!set) continue;
      const ciRaw = sel.commonIndex ?? o.commonIndex ?? 0;
      const ci = (ciRaw && typeof ciRaw === 'object') ? (ciRaw[w] ?? 0) : ciRaw;
      const common = set.commons[ci];
      const cond = conditionLabel(res.params);
      const strategy = (res.params.useTails ? 'KASP (FAM/HEX tail)' : 'Allele sizing (tail 없음)') + (res.params.bisulfite ? ', bisulfite C→T' : '');
      for (const asp of set.asps) {
        if (!asp) continue;
        const name = `${res.name}_${asp.id}`;
        order.push([name, asp.fullUpper, asp.dir === 'F' ? 'Forward' : 'Reverse', asp.fullLength, `ASP (${asp.alleleLabel}${asp.tail ? ', ' + asp.tail.name : ''})`, scale]);
        basis.push([res.name, asp.id, cropText, genomicCoord(res, asp.start, asp.end), `${asp.start}-${asp.end}`, cond, f1(asp.tm), f1(asp.gc), asp.lc, '', '', specText(asp), strategy, asp.warnings.join('; ')]);
      }
      if (common) {
        const name = `${res.name}_${common.id}`;
        order.push([name, common.seqUpper, common.dir === 'F' ? 'Forward' : 'Reverse', common.length, 'Common', scale]);
        basis.push([res.name, common.id, cropText, genomicCoord(res, common.start, common.end), `${common.start}-${common.end}`, cond, f1(common.tm), f1(common.gc), common.lc, common.ampliconLabel + (common.tailLen ? ` (tail 제외 ${common.ampliconLabelNoTail})` : ''), f1(common.ampliconTm), specText(common), strategy, common.warnings.join('; ')]);
      }
    }
  }
  return { order, basis };
}

export const EXCEL_STYLE = Object.freeze({
  headerFill: '0C3026',
  headerFont: 'FFFFFF',
  fontName: 'KoPub Dotum',
  freeze: 'A2',
});

export function fmt1(x) { return f1(x); }
export function fmt0(x) { return f0(x); }
