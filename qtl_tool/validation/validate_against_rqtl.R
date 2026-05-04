#!/usr/bin/env Rscript
# QTL Mapping Tool v1.0 — R/qtl 교차검증 스크립트
#
# 본 도구의 IM/CIM/Permutation 결과를 R/qtl과 비교합니다.
# 본 도구는 Haley-Knott 회귀 기반이므로 R/qtl method="hk"와 비교가 적절합니다.
#
# 실행:
#   Rscript validate_against_rqtl.R
#
# 출력:
#   expected_hyper_IM.csv        — R/qtl hyper(BC1) IM 결과
#   expected_hyper_perms.csv     — hyper permutation threshold
#   expected_listeria_IM.csv     — listeria(F2) IM 결과
#   expected_results.json        — 본 도구 결과와 비교용 정답값
#
# 비교 기준:
#   - LOD ±0.1 이내 일치 (출판 표준)
#   - 마커 순위 상위 5개 동일
#   - Permutation threshold ±5% (random seed)

library(qtl)

# ---- 1. hyper (BC1, 250 indiv, 174 markers) ----
data(hyper)
hyper <- calc.genoprob(hyper, step=1)
out_im_h <- scanone(hyper, method="hk")
write.csv(out_im_h, "expected_hyper_IM.csv", row.names=TRUE)
cat("[OK] hyper IM saved\n")

set.seed(42)
operm_h <- scanone(hyper, method="hk", n.perm=1000)
perm_summary_h <- summary(operm_h)
write.csv(perm_summary_h, "expected_hyper_perms.csv")
cat("[OK] hyper permutation thresholds:\n")
print(perm_summary_h)

# ---- 2. listeria (F2, 161 indiv, 133 markers) ----
data(listeria)
listeria <- calc.genoprob(listeria, step=1)
out_im_l <- scanone(listeria, method="hk")
write.csv(out_im_l, "expected_listeria_IM.csv", row.names=TRUE)
cat("[OK] listeria IM saved\n")

# ---- 3. JSON 정답 파일 ----
hyper_top <- head(out_im_h[order(-out_im_h$lod), ], 5)
listeria_top <- head(out_im_l[order(-out_im_l$lod), ], 5)

expected <- list(
  hyper = list(
    description = "R/qtl hyper dataset (BC1, 250 indiv, 174 markers, blood pressure)",
    n_indiv = 250,
    method = "Haley-Knott regression (method='hk')",
    top5_peaks = lapply(seq_len(nrow(hyper_top)), function(i) {
      list(chr = as.character(hyper_top$chr[i]),
           pos = hyper_top$pos[i],
           lod = hyper_top$lod[i])
    }),
    perm_alpha_05 = perm_summary_h["0.05", 1],
    perm_alpha_01 = perm_summary_h["0.01", 1]
  ),
  listeria = list(
    description = "R/qtl listeria dataset (F2, 161 indiv, 133 markers, listeria infection)",
    n_indiv = 161,
    method = "Haley-Knott regression (method='hk')",
    top5_peaks = lapply(seq_len(nrow(listeria_top)), function(i) {
      list(chr = as.character(listeria_top$chr[i]),
           pos = listeria_top$pos[i],
           lod = listeria_top$lod[i])
    })
  ),
  validation_criteria = list(
    LOD_tolerance = 0.1,
    perm_threshold_tolerance_pct = 5,
    rank_match_top_n = 5
  ),
  notes = c(
    "본 도구의 cM 위치는 R/qtl과 동일한 calc.genoprob step=1 결과를 비교합니다",
    "본 도구는 method='hk' (Haley-Knott 회귀)와 일치하도록 설계되었습니다",
    "method='em' (EM algorithm)과는 LOD 값이 약간 다를 수 있습니다 (보통 ±0.2)"
  )
)

# JSON 출력 (jsonlite 필요)
if (requireNamespace("jsonlite", quietly = TRUE)) {
  jsonlite::write_json(expected, "expected_results.json", pretty = TRUE, auto_unbox = TRUE)
  cat("[OK] expected_results.json saved\n")
} else {
  cat("[WARN] jsonlite 패키지 없음. install.packages('jsonlite') 후 재실행 권장\n")
}

cat("\n=== R/qtl 교차검증 완료 ===\n")
cat("본 도구의 결과를 expected_*.csv 파일과 비교하시기 바랍니다.\n")
cat("LOD ±0.1 이내 일치, 상위 5개 peak 위치 동일이면 통과.\n")
