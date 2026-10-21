import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findDimer, findSelfDimer, isDimer, formatDimer } from '../src/core/dimer.js';
import { revcomp } from '../src/core/seq.js';

// flank 끼리는 절대 상보가 되지 않도록 한쪽은 T, 다른 쪽은 C 로 채운다
const FT = 'TTTTTTTTT';
const FC = 'CCCCCCCCC';

test('완전 상보 6-mer 를 공유하면 양성', () => {
  const core = 'GCATCG';
  const p1 = FT + core + FT;
  const p2 = FC + revcomp(core) + FC;
  const r = findDimer(p1, p2, { threshold: 6 });
  assert.ok(r && r.isDimer, JSON.stringify(r));
  assert.equal(r.matches, 6);
});

test('무관한 서열은 음성', () => {
  const p1 = 'AAAAAAAAAAAAAAAAAAAA';
  const p2 = 'CCCCCCCCCCCCCCCCCCCC';
  assert.equal(isDimer(p1, p2), false);
  assert.equal(findDimer(p1, p2), null);
});

test('3′ 말단 관여를 보고', () => {
  const p1 = 'TTTTTTTTTTTTTTGCATCG';           // 3' 끝이 GCATCG
  const p2 = 'CGATGCCCCCCCCCCCCCCC';           // 5' 끝이 CGATGC = revcomp(GCATCG)
  const r = findDimer(p1, p2);
  assert.ok(r && r.isDimer, JSON.stringify(r));
  assert.equal(r.threePrimeA, true);
  assert.equal(r.threePrimeB, false);
});

test('미스매치 1개 허용: 5+1 로 6 상보쌍', () => {
  const seg1 = 'GCATCGA';
  const seg2 = revcomp('GCATCTA'); // 6번째 염기만 불일치
  const p1 = FT + seg1 + FT;
  const p2 = FC + seg2 + FC;
  const r = findDimer(p1, p2, { threshold: 6 });
  assert.ok(r, 'no alignment');
  assert.equal(r.matches, 6, JSON.stringify(r));
  assert.equal(r.isDimer, true);
});

test('임계 7 이면 6 상보쌍은 음성', () => {
  const core = 'GCATCG';
  const p1 = FT + core + FT;
  const p2 = FC + revcomp(core) + FC;
  assert.equal(isDimer(p1, p2, { threshold: 7 }), false);
  assert.equal(isDimer(p1, p2, { threshold: 6 }), true);
});

test('자기 다이머: 회문 서열은 양성', () => {
  const r = findSelfDimer('TTTTTTGGATCCTTTTTT');
  assert.ok(r && r.isDimer);
  const txt = formatDimer('TTTTTTGGATCCTTTTTT', 'TTTTTTGGATCCTTTTTT', r);
  assert.ok(txt.includes('|'));
});
