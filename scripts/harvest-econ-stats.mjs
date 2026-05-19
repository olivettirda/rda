#!/usr/bin/env node
/**
 * econ_stats.json 자동 수집기 (GitHub Actions에서 실행)
 *
 * 설계 원칙(중요):
 *  - 설정(scripts/econ-sources.json)이 없거나 placeholder('TODO'/빈값)면 해당 작목은 SKIP.
 *  - API 오류/빈 응답이면 기존 econ_stats.json 값을 그대로 유지(검증된 데이터를 절대 훼손하지 않음).
 *  - AMIS는 응답 co* 스키마가 확정돼 정확 매핑. KOSIS는 통계표 ID를 사용자가 설정에 채워야 함(추측 금지).
 *  - 비밀키는 환경변수(GitHub Secrets): AMIS_API_KEY, AMIS_USE_DOMAIN, KOSIS_API_KEY.
 *  - 어떤 경우에도 프로세스는 0으로 종료(워크플로 실패 스팸 방지). 변경분은 워크플로가 커밋.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const STATS_PATH = ROOT + 'econ_stats.json';
const CFG_PATH = existsSync(ROOT + 'scripts/econ-sources.json')
  ? ROOT + 'scripts/econ-sources.json'
  : ROOT + 'scripts/econ-sources.example.json';

const isTodo = v => v == null || v === '' || String(v).startsWith('TODO');
const num = v => { const n = parseFloat(String(v ?? '').replace(/[, ]/g, '')); return Number.isFinite(n) ? n : null; };

function amisXmlVal(xml, tag) {
  const m = xml.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'))
        || xml.match(new RegExp('<' + tag + 'Sum>([\\s\\S]*?)</' + tag + 'Sum>'));
  return m ? m[1].trim() : '';
}

async function harvestAmis(crop, a, year) {
  const key = process.env.AMIS_API_KEY, dom = process.env.AMIS_USE_DOMAIN;
  if (isTodo(a.insCode) || isTodo(a.jakmokCode)) return { skip: '미설정' };
  const q = new URLSearchParams({ wYear: year, insCode: a.insCode, jakmokCode: a.jakmokCode, div_id: 'harvest' });
  if (key) q.set('apiKey', key);
  if (dom) q.set('useDomain', dom);
  if (a.sidoCode) q.set('sidoCode', a.sidoCode);
  if (a.sigunCode) q.set('sigunCode', a.sigunCode);
  const url = 'https://amis.rda.go.kr/portal/openapi/ap/survey/profitAnalysisxml?' + q;
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const xml = await res.text();
  const rc = amisXmlVal(xml, 'resultCode');
  if (rc && rc !== '00') return { skip: 'resultCode ' + rc };
  const rev = num(amisXmlVal(xml, 'co010000Cost'));
  if (rev == null) return { skip: '데이터 없음' };
  return {
    tier: 'ok',
    조수입: rev,
    경영비: num(amisXmlVal(xml, 'co030000Cost')),
    소득: num(amisXmlVal(xml, 'co050000Cost')),
    소득률: num(amisXmlVal(xml, 'co050104Amount')),
    단가: num(amisXmlVal(xml, 'co010100Unitcost')),
    수량: num(amisXmlVal(xml, 'co010100Amount')),
    note: 'AMIS Open API profitAnalysisxml 자동수집',
    url: 'https://amis.rda.go.kr'
  };
}

async function harvestKosis(crop, k, year) {
  const key = process.env.KOSIS_API_KEY;
  if (!key || isTodo(k.orgId) || isTodo(k.tblId)) return { skip: '미설정(KOSIS 통계표 ID 필요)' };
  const q = new URLSearchParams({
    method: 'getList', apiKey: key, format: 'json', jsonVD: 'Y',
    orgId: k.orgId, tblId: k.tblId, prdSe: k.prdSe || 'Y',
    startPrdDe: year, endPrdDe: year
  });
  const res = await fetch('https://kosis.kr/openapi/Param/statisticsParameterData.do?' + q,
    { signal: AbortSignal.timeout(20000) });
  let rows;
  try { rows = await res.json(); } catch { return { skip: 'JSON 파싱 실패' }; }
  if (!Array.isArray(rows) || !rows.length) return { skip: '데이터 없음/오류코드' };
  const out = { tier: 'ok', note: 'KOSIS OpenAPI 자동수집', url: 'https://kosis.kr' };
  const map = k.objMap || {};
  for (const [field, itmId] of Object.entries(map)) {
    if (isTodo(itmId)) continue;
    const r = rows.find(x => x.ITM_ID === itmId || x.C1 === itmId);
    if (r) out[field] = num(r.DT);
  }
  return ('조수입' in out || '단가' in out) ? out : { skip: 'objMap 미설정' };
}

async function main() {
  if (!existsSync(STATS_PATH)) { console.log('econ_stats.json 없음 — 중단'); return; }
  const stats = JSON.parse(readFileSync(STATS_PATH, 'utf8'));
  const cfg = JSON.parse(readFileSync(CFG_PATH, 'utf8'));
  const year = String(cfg.year || new Date().getFullYear() - 1);
  let changed = 0;

  for (const [crop, c] of Object.entries(cfg.crops || {})) {
    if (!c || c.provider === 'skip') { console.log(`- ${crop}: skip`); continue; }
    let r;
    try {
      if (c.provider === 'amis') r = await harvestAmis(crop, c.amis || {}, year);
      else if (c.provider === 'kosis') r = await harvestKosis(crop, c.kosis || {}, year);
      else { console.log(`- ${crop}: unknown provider`); continue; }
    } catch (e) { console.log(`- ${crop}: 오류 ${e.message} → 기존값 유지`); continue; }

    if (r.skip) { console.log(`- ${crop}: ${r.skip} → 기존값 유지`); continue; }
    // 기존값 보호: 신규가 null이면 기존 유지
    stats[crop] = stats[crop] || {};
    const prev = stats[crop][year] || {};
    const merged = { ...prev };
    for (const f of ['tier', '조수입', '경영비', '소득', '소득률', '단가', '수량', 'note', 'url']) {
      if (r[f] != null) merged[f] = r[f];
    }
    stats[crop][year] = merged;
    changed++;
    console.log(`+ ${crop} ${year}: 갱신`);
  }

  if (changed) {
    stats._meta = stats._meta || {};
    stats._meta.updated = new Date().toISOString().slice(0, 10);
    stats._meta.source = `auto-harvest ${stats._meta.updated} (${changed} crops)`;
    writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2) + '\n');
    console.log(`econ_stats.json 갱신 완료 (${changed} 작목)`);
  } else {
    console.log('갱신할 항목 없음 (설정/키 확인). 기존 데이터 유지.');
  }
}

main().catch(e => { console.error('치명 오류(무시):', e); }).finally(() => process.exit(0));
