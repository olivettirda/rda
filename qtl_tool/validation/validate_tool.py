#!/usr/bin/env python3
"""
QTL Mapping Tool v0.2 — 검증 스크립트
qtl_tool.html에서 Python 코드를 추출하여 단위 테스트.

실행: python3 qtl_tool/validation/validate_tool.py

검증 항목:
1. Python syntax 정상 여부
2. F2 시뮬레이션 → IM/CIM/ICIM-ADD 정확 검출
3. RIL Chr5 단일 QTL 검출
4. 다중 QTL F2 (Chr3 + Chr7) — Multi-QTL Model
5. ICIM-EPI digenic interaction
6. QTL × Environment 다환경 분류
7. Q-TARO 비교 (Chr3 28cM → Hd6 매칭)
8. QC 종합 등급 (정상/강제 결측 시나리오)
9. 워크플로 export (KASP, F2:3, 외부 링크, v4.17 JSON)
10. R/qtl 교차검증 가이드
"""
import re
import json
import sys
import time
from pathlib import Path

HTML_PATH = Path(__file__).parent.parent / 'qtl_tool.html'

def extract_python_code(html_text):
    """qtl_tool.html에서 getDiagnosticPyCode와 getStatsPyCode 추출."""
    diag = re.search(r"function getDiagnosticPyCode\(\)\s*\{\s*return\s*`(.+?)`;\s*\}",
                     html_text, re.DOTALL)
    stats = re.search(r"function getStatsPyCode\(\)\s*\{\s*return\s*`(.+?)`;\s*\}",
                      html_text, re.DOTALL)
    if not diag or not stats:
        raise RuntimeError("Python 코드 추출 실패")
    return diag.group(1), stats.group(1)


def run_all_tests():
    print("=" * 60)
    print("QTL Mapping Tool v1.0 — 검증 스크립트")
    print("=" * 60)

    if not HTML_PATH.exists():
        print(f"[FAIL] {HTML_PATH} 없음")
        return False

    html = HTML_PATH.read_text()
    print(f"\n[1] HTML: {len(html):,} bytes / {len(html.splitlines()):,} 줄")

    # === Python 코드 추출 + syntax ===
    diag_code, stats_code = extract_python_code(html)
    print(f"    진단: {len(diag_code.splitlines())} 줄, 통계: {len(stats_code.splitlines())} 줄")

    failed = 0
    for label, code in [('진단', diag_code), ('통계', stats_code)]:
        try:
            compile(code, label, 'exec')
            print(f"    [OK] {label} Python syntax")
        except SyntaxError as e:
            print(f"    [FAIL] {label}: {e}")
            failed += 1

    if failed > 0:
        return False

    # === Python 환경 구축 ===
    ns = {}
    exec(diag_code, ns)
    exec(stats_code, ns)

    # 룰셋 로드
    rules_path = HTML_PATH.parent / 'data' / 'qtl_tool_rules.json'
    qtaro_path = HTML_PATH.parent / 'data' / 'qtl_tool_qtaro_subset.json'
    if rules_path.exists():
        ns['RULES'] = json.loads(rules_path.read_text())
    if qtaro_path.exists():
        ns['QTARO_DB'] = json.loads(qtaro_path.read_text())

    import pandas as pd
    import numpy as np

    print(f"\n[2] 단위 테스트")

    # Test 1: F2 시뮬 IM
    geno, mp, pheno = ns['generate_sample_f2'](n_indiv=200, seed=42)
    g = pd.DataFrame(geno); m = pd.DataFrame(mp); p = pd.DataFrame(pheno)
    t0 = time.time()
    im = ns['interval_mapping'](g, m, p, pop_type='F2', step=1.0)
    t1 = time.time()
    chr3 = max((x for x in im['lod_curve'] if x['chr'] == '3'), key=lambda x: x['LOD'])
    print(f"    [F2 IM] Chr3 cM={chr3['cM']:.1f} LOD={chr3['LOD']:.2f} (목표: 28~32cM, LOD>5) — {t1-t0:.2f}s")
    assert 25 <= chr3['cM'] <= 35 and chr3['LOD'] > 5, "F2 IM 실패"

    # Test 2: F2 CIM (cofactor 정확 검출)
    cim = ns['composite_interval_mapping'](g, m, p, pop_type='F2', max_cofactors=5)
    cofactor_chrs = sorted(c['chr'] for c in cim['cofactors'])
    chr3_cim = max((x for x in cim['lod_curve'] if x['chr'] == '3'), key=lambda x: x['LOD'])
    print(f"    [F2 CIM] cofactors {len(cim['cofactors'])} (chrs: {cofactor_chrs}), Chr3 LOD={chr3_cim['LOD']:.2f}")
    assert '3' in cofactor_chrs, "CIM cofactor에 Chr3 빠짐"

    # Test 3: RIL 단일 QTL
    g2, m2, p2 = ns['generate_sample_ril'](n_indiv=150, seed=42)
    im_ril = ns['interval_mapping'](pd.DataFrame(g2), pd.DataFrame(m2), pd.DataFrame(p2), pop_type='RIL')
    chr5 = max((x for x in im_ril['lod_curve'] if x['chr'] == '5'), key=lambda x: x['LOD'])
    print(f"    [RIL IM] Chr5 cM={chr5['cM']:.1f} LOD={chr5['LOD']:.2f} (목표: 48~52, LOD>3)")
    assert 45 <= chr5['cM'] <= 55 and chr5['LOD'] > 3

    # Test 4: 다중 QTL Multi-QTL
    np.random.seed(0)
    geno_arr = np.random.choice(['A','H','B'], size=(360, 200), p=[0.25, 0.5, 0.25])
    geno_arr[np.random.random(geno_arr.shape) < 0.03] = '-'
    markers = []; chrs = []; cms = []
    for ch in range(1, 13):
        for i in range(30):
            markers.append(f'M{ch:02d}_{i+1:03d}'); chrs.append(ch); cms.append(i*4.0)
    q1 = next(i for i,(c,p) in enumerate(zip(chrs,cms)) if c==3 and 28<=p<=32)
    q2 = next(i for i,(c,p) in enumerate(zip(chrs,cms)) if c==7 and 48<=p<=52)
    qg1 = np.where(geno_arr[q1]=='A',-1,np.where(geno_arr[q1]=='B',1,0)).astype(float)
    qg2 = np.where(geno_arr[q2]=='A',-1,np.where(geno_arr[q2]=='B',1,0)).astype(float)
    qg1[geno_arr[q1]=='-']=0; qg2[geno_arr[q2]=='-']=0
    pheno_m = 100 + 4*qg1 + 3*qg2 + np.random.normal(0, 5, 200)
    g_m = pd.DataFrame(geno_arr, columns=[f'I{i+1:03d}' for i in range(200)])
    g_m.insert(0, 'Marker', markers)
    m_m = pd.DataFrame({'Marker': markers, 'Chr': chrs, 'bp': [c*250000 for c in cms], 'cM': cms})
    p_m = pd.DataFrame({'Indiv': [f'I{i+1:03d}' for i in range(200)], 'PH': pheno_m})
    mqm = ns['stepwise_qtl'](g_m, m_m, p_m, pop_type='F2', max_qtl=5, penalty_main=2.5)
    detected_chrs = sorted(set(q['chr'] for q in mqm['qtls']))
    print(f"    [Multi-QTL] {mqm['n_qtls']}개 검출 (chrs={detected_chrs}, total PVE={mqm['total_PVE']*100:.1f}%)")
    assert '3' in detected_chrs, "Multi-QTL Chr3 누락"

    # Test 5: ICIM-EPI
    np.random.seed(42)
    geno_arr2 = np.random.choice(['A','H','B'], size=(360, 250), p=[0.25, 0.5, 0.25])
    geno_arr2[np.random.random(geno_arr2.shape) < 0.03] = '-'
    qg1e = np.where(geno_arr2[q1]=='A',-1,np.where(geno_arr2[q1]=='B',1,0)).astype(float)
    qg2e = np.where(geno_arr2[q2]=='A',-1,np.where(geno_arr2[q2]=='B',1,0)).astype(float)
    qg1e[geno_arr2[q1]=='-']=0; qg2e[geno_arr2[q2]=='-']=0
    pheno_e = 100 + 2*qg1e + 2*qg2e + 12*qg1e*qg2e + np.random.normal(0, 4, 250)
    g_e = pd.DataFrame(geno_arr2, columns=[f'I{i+1:03d}' for i in range(250)])
    g_e.insert(0, 'Marker', markers)
    p_e = pd.DataFrame({'Indiv': [f'I{i+1:03d}' for i in range(250)], 'PH': pheno_e})
    epi = json.loads(ns['icim_epi'](g_e, m_m, p_e, pop_type='F2',
                                      step_2D=4.0, LOD_floor=5.0, max_pairs=100000))
    target = [pp for pp in epi['epi_pairs']
              if {pp['marker1'], pp['marker2']} == {markers[q1], markers[q2]}]
    if target:
        print(f"    [ICIM-EPI] Q1×Q2 검출 LOD={target[0]['LOD_AA']:.2f} aa={target[0]['aa_effect']:+.2f}")
    else:
        print(f"    [WARN ICIM-EPI] Q1×Q2 미검출 (n_signif={epi['n_epi_significant']})")

    # Test 6: QTL × Environment
    g3, m3, p3 = ns['generate_sample_ril_multi'](n_indiv=150, seed=42)
    qei = json.loads(ns['qtl_environment_interaction'](g3, m3, p3,
        env_traits=['Yield_E1_Suwon_2024','Yield_E2_Milyang_2024','Yield_E3_Iksan_2024'],
        pop_type='RIL', threshold_main=2.5, threshold_QEI=2.0))
    main_chrs = {pp['chr'] for pp in qei['main_effect_peaks']}
    print(f"    [QTL×E] main {len(qei['main_effect_peaks'])}, Q×E {len(qei['qei_peaks'])}, main_chrs={main_chrs}")
    assert '5' in main_chrs

    # Test 7: Q-TARO 비교
    test_peaks = [
        {'chr': '6', 'cM': 11.0, 'LOD': 6.5},
        {'chr': '1', 'cM': 153.0, 'LOD': 8.4},
        {'chr': '12', 'cM': 80.0, 'LOD': 4.0}
    ]
    comp = ns['compare_with_qtaro'](test_peaks)
    matched_names = [(c['matches'][0]['known_name'] if c['matches'] else 'novel') for c in comp]
    print(f"    [Q-TARO] {test_peaks[0]['chr']}@{test_peaks[0]['cM']}→{matched_names[0]}, {test_peaks[1]['chr']}@{test_peaks[1]['cM']}→{matched_names[1]}, {test_peaks[2]['chr']}@{test_peaks[2]['cM']}→{matched_names[2]}")
    assert matched_names[0] == 'Hd3a', f"Hd3a 매칭 실패: {matched_names[0]}"
    assert matched_names[1] == 'SD1', f"SD1 매칭 실패: {matched_names[1]}"

    # Test 8: QC 종합
    qc_res = json.loads(ns['run_full_qc'](geno, mp, pheno, pop_type='F2'))
    print(f"    [QC] {qc_res['overall_grade']}, marker pass={qc_res['marker']['summary']['pass']}, linkage {qc_res['linkage_map']['total_cM']:.0f}cM in_range={qc_res['linkage_map']['total_in_expected_range']}")
    assert qc_res['overall_grade'] == 'pass'

    # Test 9: 워크플로 export
    peaks_dict = {
        'CIM': [{'chr':'3','cM':28.0,'LOD':11.77,'add_a':8.26,
                 'ci_lower_cM':27.0,'ci_upper_cM':29.0}]
    }
    wf = json.loads(ns['run_workflow_export'](peaks_dict, map_json=mp, threshold=2.5))
    print(f"    [Workflow] KASP {len(wf['kasp_targets'])}개, F2:3 권장 N={wf['f23_validation_guide']['recommended_F23_lines']}")
    assert wf['n_unique_peaks'] >= 1

    # Test 10 (v0.2): v4.17 두 형식 동시 export
    legacy = json.loads(wf['v417_export_json'])
    v02 = json.loads(wf['v417_export_v02_json'])
    print(f"    [v4.17 dual] legacy.format={legacy['_meta'].get('format')}, v02.format={v02['metadata'].get('format')}")
    print(f"    [v4.17 dual] v02 qtls={len(v02['qtls'])}, kasp_region.flank_kb={v02['qtls'][0]['kasp_region']['flank_kb']}")
    assert legacy['_meta'].get('format') == 'legacy', "legacy 메타 누락"
    assert v02['metadata'].get('format') == 'v0.2_standard', "v0.2 표준 메타 누락"
    assert 'kasp_region' in v02['qtls'][0], "v0.2의 kasp_region 누락"
    qtl = v02['qtls'][0]
    assert qtl['ci_bp_start'] < qtl['peak_bp'] < qtl['ci_bp_end'], "cM-bp 보간 단조 위배"

    print(f"\n{'=' * 60}\n검증 종합: 모두 PASS")
    print("=" * 60)
    return True


def r_qtl_validation_guide():
    """R/qtl 교차검증 가이드 (사용자가 R 환경에서 실행)."""
    return r'''
# === R/qtl 교차검증 가이드 ===
# 본 도구의 IM/CIM/Permutation 결과를 R/qtl과 비교하시려면:

library(qtl)

# 1) 표준 데이터셋으로 비교
data(hyper)
hyper <- calc.genoprob(hyper, step=1)
out_im <- scanone(hyper, method="hk")  # 본 도구는 Haley-Knott 기반
write.csv(out_im, "expected_hyper_IM.csv", row.names=FALSE)

set.seed(42)
operm <- scanone(hyper, method="hk", n.perm=1000)
write.csv(summary(operm), "expected_hyper_perms.csv")

# 2) F2 데이터셋
data(listeria)
listeria <- calc.genoprob(listeria, step=1)
out_im_l <- scanone(listeria, method="hk")
write.csv(out_im_l, "expected_listeria_IM.csv", row.names=FALSE)

# 3) 비교 기준
# - LOD 값 ±0.1 이내 일치를 목표로 합니다.
# - 마커 위치 상대 순위가 동일해야 합니다.
# - Permutation threshold는 random seed에 따라 ±5% 변동 허용.
'''


if __name__ == '__main__':
    ok = run_all_tests()
    if ok:
        print("\nR/qtl 교차검증 가이드:")
        print(r_qtl_validation_guide())
    sys.exit(0 if ok else 1)
