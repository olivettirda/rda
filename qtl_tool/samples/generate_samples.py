#!/usr/bin/env python3
"""
qtl_tool.html에서 샘플 데이터 생성 함수를 추출하여 .csv로 export.
"""
import re
import sys
from pathlib import Path

HTML_PATH = Path(__file__).parent.parent / 'qtl_tool.html'
OUT_DIR = Path(__file__).parent

if not HTML_PATH.exists():
    print(f"FAIL: {HTML_PATH} 없음")
    sys.exit(1)

html = HTML_PATH.read_text()
diag = re.search(r"function getDiagnosticPyCode\(\)\s*\{\s*return\s*`(.+?)`;\s*\}",
                 html, re.DOTALL).group(1)
ns = {}
exec(diag, ns)

import pandas as pd

print(f"샘플 생성: {OUT_DIR}")

for kind, label in [('f2', 'F2'), ('ril', 'RIL'), ('ril_multi', 'RIL_multi_env')]:
    print(f"\n[{label}] 생성 중...")
    if kind == 'f2':
        geno, mp, pheno = ns['generate_sample_f2']()
    elif kind == 'ril':
        geno, mp, pheno = ns['generate_sample_ril']()
    else:
        geno, mp, pheno = ns['generate_sample_ril_multi']()

    g_df = pd.DataFrame(geno)
    m_df = pd.DataFrame(mp)
    p_df = pd.DataFrame(pheno)

    g_path = OUT_DIR / f'sample_{kind}_geno.csv'
    m_path = OUT_DIR / f'sample_{kind}_map.csv'
    p_path = OUT_DIR / f'sample_{kind}_pheno.csv'

    g_df.to_csv(g_path, index=False)
    m_df.to_csv(m_path, index=False)
    p_df.to_csv(p_path, index=False)

    print(f"  geno  → {g_path.name} ({g_df.shape[0]} markers × {g_df.shape[1]-1} indiv)")
    print(f"  map   → {m_path.name} ({m_df.shape[0]} markers)")
    print(f"  pheno → {p_path.name} ({p_df.shape[0]} indiv × {p_df.shape[1]-1} traits)")

print("\n[OK] 모든 샘플 생성 완료")
