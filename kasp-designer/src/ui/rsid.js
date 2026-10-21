/**
 * rsid.js — Ensembl REST 로 변이 ID → flank 포함 FASTA 생성 (온라인 옵션)
 *  - 변이: GET https://rest.ensembl.org/variation/{species}/{id}
 *  - 서열: GET https://rest.ensembl.org/sequence/region/{species}/{chr}:{s}..{e}:1
 *  벼(oryza_sativa)는 Ensembl Plants 데이터가 같은 REST 서버로 제공된다.
 */
import { revcomp } from '../core/seq.js';

const REST = 'https://rest.ensembl.org';

async function getJson(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getText(url, timeoutMs) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { Accept: 'text/plain' }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/**
 * @returns {Promise<{fasta:string, note:string}>}
 */
export async function fetchVariantFasta(id, species = 'oryza_sativa', flank = 200, { timeoutMs = 12000 } = {}) {
  const vid = String(id || '').trim();
  if (!vid) throw new Error('ID 가 비어 있습니다');
  const sp = String(species || 'oryza_sativa').trim();
  const fl = Math.max(30, Math.min(2000, Number(flank) || 200));

  const v = await getJson(`${REST}/variation/${encodeURIComponent(sp)}/${encodeURIComponent(vid)}?content-type=application/json`, timeoutMs);
  const mappings = Array.isArray(v.mappings) ? v.mappings : [];
  if (!mappings.length) throw new Error('유전체 위치(mapping)가 없습니다');
  const m = mappings.find((x) => Number(x.strand) === 1) || mappings[0];
  const chr = m.seq_region_name;
  const start = Number(m.start), end = Number(m.end);
  if (!chr || !Number.isFinite(start) || !Number.isFinite(end)) throw new Error('좌표를 해석할 수 없습니다');
  let alleles = String(m.allele_string || v.allele_string || '').split('/').map((a) => a.trim()).filter((a) => a.length);
  if (alleles.length < 2) throw new Error('대립유전자 정보가 없습니다');
  if (Number(m.strand) === -1) alleles = alleles.map((a) => (a === '-' ? a : revcomp(a)));

  const isInsertion = end < start; // Ensembl: 삽입은 end = start − 1
  const refLen = isInsertion ? 0 : end - start + 1;
  const regStart = Math.max(1, (isInsertion ? end : start) - fl);
  const regEnd = (isInsertion ? start - 1 : end) + fl;
  const seq = (await getText(`${REST}/sequence/region/${encodeURIComponent(sp)}/${chr}:${regStart}..${regEnd}:1?content-type=text/plain`, timeoutMs)).replace(/\s+/g, '');
  const leftLen = (isInsertion ? end : start) - regStart;
  const left = seq.slice(0, leftLen);
  const refObserved = seq.slice(leftLen, leftLen + refLen);
  const right = seq.slice(leftLen + refLen);

  let note = `${vid} (${chr}:${start}, ${alleles.join('/')}) 서열을 추가했습니다.`;
  if (refLen && refObserved.toUpperCase() !== alleles[0].toUpperCase()) {
    note += ` 참고: 기준 서열 ${refObserved.toUpperCase()} 와 첫 대립유전자 ${alleles[0]} 가 다릅니다. 가닥·좌표를 확인하세요.`;
  }
  const fasta = `>${vid} ${chr}:${start} ${alleles.join('/')}\n${left.toLowerCase()}[${alleles.join('/')}]${right.toLowerCase()}`;
  return { fasta, note };
}
