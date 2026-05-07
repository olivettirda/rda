# QTL Mapping Tool — 밀(wheat) 확장 리서치 브리프

> 목적: 현재 벼(Oryza sativa, IRGSP-1.0) 전용으로 동작하는 `qtl_tool.html`을 밀(Triticum aestivum, IWGSC RefSeq v2.1)에도 적용 가능하도록 확장하기 위한 작업 범위·기술 결정·위험요소 정리.
>
> 본 문서는 사양(spec)이 아니라 **리서치 브리프**입니다. 결정이 필요한 항목은 모두 "검증 필요"로 표시했고, 추정 수치는 포함하지 않았습니다.

---

## 1. 결론 요약

| 항목 | 판정 |
|---|---|
| 통계 코어(Tier 1~4: SMA / IM / CIM / ICIM-ADD / Permutation / EPI / QEI) | **그대로 사용 가능** — 종(species) 의존성 없음 |
| 입력 데이터 스키마(Genotype `A/B/H/-`, Map `Marker/Chr/cM/bp`, Phenotype) | **그대로 사용 가능** — 단, Chr 값 도메인이 1~12 → 1A~7D로 변경됨 |
| 외부 좌표/유전자 서비스(Gramene, Ensembl Plants REST, NCBI eutils, RAP-DB) | **species, accession, view URL 모두 교체 필요** |
| Q-TARO subset(`qtl_tool_qtaro_subset.json`) | **밀 등가 자료 신규 도입 필요** (Q-TARO는 벼 전용 DB) |
| 룰셋(`qtl_tool_rules.json`) — 마커 밀도/집단/형질별 권장값 | **밀 컨텍스트로 재교정 필요** — 마커 cM 길이·QTL CI 폭 분포가 다름 |
| KASP 마커 설계(`.claude/rules/kasp.md`) | 표준은 밀에도 그대로 적용 가능 — 단, **품종 SNP 검증 절차가 다름** |

**핵심 결정사항(요약)**

1. 단일 도구를 multi-species로 확장할지, 별도 파일(`qtl_tool_wheat.html`)로 분기할지 → §6 참고
2. 밀 reference DB 1차/폴백 조합 → §4 표 참조 (1차: Ensembl Plants Triticum aestivum REST, 폴백: URGI 또는 GrainGenes 외부 링크)
3. 룰셋 재교정에 사용할 reference panel → 검증 필요 (Wheat 90K, TaBW280K, BWMRI/CIMMYT 패널 후보)

---

## 2. 게놈/생물학적 차이 (Rice vs Wheat)

| 항목 | Rice (현행) | Wheat (목표) | 도구 영향 |
|---|---|---|---|
| 학명 | *Oryza sativa* | *Triticum aestivum* (bread wheat) | URL slug 변경 |
| Ploidy | 2n = 2x = 24 | 2n = 6x = 42 (AABBDD) | 분리비·heterozygosity 모델, IM/CIM 가산·우성 추정 |
| 염색체 수 | 12 | 21 (1A~7D, 7 homoeologous group × 3 subgenome) | UI Chr selector, 룰셋, plot x-axis |
| Reference assembly | IRGSP-1.0 (Kawahara et al. 2013) | IWGSC RefSeq v2.1 (Zhu et al. 2021 *Plant J*) | 좌표·FASTA 다운로드·외부 링크 |
| Genome size | ~389 Mb | ~16 Gb (rice의 약 40배) | FASTA 다운로드 5 Mb 경고선 재검토 |
| Genetic map 길이 | 1140~1900 cM (도구 기대치) | **검증 필요** (Wheat consensus map: cultivar별 편차 큼) | `qtl_tool.html` Tab 1 QC 메시지 (line 5475) |
| 자가수정/타가수정 | 자가수정 (RIL/F2/BC 적용) | 자가수정 (동일하게 RIL/DH/F2 적용 가능) | 집단 유형 분기 그대로 사용 |

**ploidy로 인한 통계 코어 영향 — 중요**

밀 hexaploid이지만 **homoeologous loci 간 재조합이 거의 없으므로**, 표준 mapping panel(RIL/DH/F2)에서는 각 sub-genome locus가 disomic 분리합니다. 즉 SMA/IM/CIM의 가산-우성 분해(`a`, `d`)는 rice와 동일한 가정으로 적용 가능합니다. 단, **synthetic hexaploid 또는 amphiploid 패널**의 경우 별도 모델 필요(이번 확장 범위에서는 제외 권장).

---

## 3. 코드 변경 위치 인벤토리 (qtl_tool.html)

벼 종속 코드의 절대좌표(현재 main 기준):

| Line | 내용 | 종 의존성 |
|---|---|---|
| 1793 | `<span class="opt-hint">벼 IRGSP-1.0</span>` | 라벨 |
| 2341, 2348 | Tab 5 카드 자막에 `IRGSP-1.0` 직접 노출 | 라벨 |
| 5475 | QC 메시지 `벼 IRGSP-1.0 기대 1140~1900cM` | **수치 재교정 필요** |
| 5643, 5898, 5995 | export JSON `IRGSP_assembly: 'IRGSP-1.0'` | 키 변경 |
| 5783 | KASP 가이드 텍스트 "RAP-DB locus 후보" | 텍스트 변경 |
| 5837–5839 | Tab 6 외부 DB 폴백 안내 (RAP-DB, SNP-Seek) | URL/문구 변경 |
| 5883 | `'Gramene': f'https://ensembl.gramene.org/Oryza_sativa/Location/View?r=...'` | **URL 변경 필요** |
| 6425, 6441, 6477 | 양식 템플릿 시트 라벨/주석 | 텍스트 |
| 6950–6955 | `IRGSP_DDBJ_ACC` (chr1~12 → AP014957~AP014968) | **밀 accession map 신규** |
| 6970 | `_ensemblFastaUrl` species `oryza_sativa` 하드코딩 | **species 분기 또는 변수화** |
| 7014, 7152 | 다운로드 파일명 suffix `_IRGSP-1.0` | 변수화 |
| 7044 | Ensembl `/overlap/region/oryza_sativa/...` | 동일 |
| 7050, 7093, 7132 | `rapdb_id` 키, RAP-DB gbrowse_details 링크 | **밀 등가 ID로 변경** |
| 7106, 7168, 7295 | UI 라벨 "IRGSP-1.0 좌표" | 변수화 |

**총 변경 hot-spot: 약 18개 위치.** 모두 **`SPECIES_CONFIG` 객체로 추출** 가능 — 이 패턴이 §6의 옵션 A 핵심.

---

## 4. 외부 데이터 소스 매핑

### 4.1 좌표/유전자 영역 조회

| 기능 | Rice (현행) | Wheat 1차 후보 | 확인 사항 |
|---|---|---|---|
| Genome browser (Location/View) | `ensembl.gramene.org/Oryza_sativa/Location/View` | `plants.ensembl.org/Triticum_aestivum/Location/View` | URL 패턴 동일, **assembly 파라미터 추가 필요 여부 검증** |
| Gene 영역 추출(REST) | `rest.ensembl.org/overlap/region/oryza_sativa/...` | `rest.ensembl.org/overlap/region/triticum_aestivum/...` | **응답 assembly_name 값 확인 필요** (`IWGSC` 또는 `IWGSC_RefSeq_v2.1`) |
| FASTA 영역 추출(REST) | `rest.ensembl.org/sequence/region/oryza_sativa/...` | `rest.ensembl.org/sequence/region/triticum_aestivum/...` | 동일. **15 req/sec rate limit 동일 적용** |
| Gene detail page | `rapdb.dna.naro.go.jp/viewer/gbrowse_details/irgsp1?name=...` | URGI Wheat Genome Browser 또는 Ensembl Plants gene page | URGI(`urgi.versailles.inrae.fr/jbrowseiwgsc`)는 deep-link 안정성 검증 필요 |
| Funct. annotation | RAP-DB, funRiceGenes | **GrainGenes**(USDA-ARS), **Wheat Expression Browser**(expVIP), **WheatOmics 1.0** | 각 DB의 안정 deep-link 패턴 검증 필요 |

### 4.2 NCBI eutils용 chromosome accession

밀의 21개 염색체에 대한 **GenBank/RefSeq accession map** 신규 작성이 필요합니다.

- IWGSC RefSeq v2.1 BioProject: PRJEB30074 (확인 필요)
- 각 chromosome scaffold의 NCBI nuccore accession은 IWGSC 공식 release 또는 Ensembl Plants TSV에서 추출 가능 → **수작업 1회로 정적 dict 작성**
- 결과물 형식 예시(검증 후 채워야 함):
  ```js
  const IWGSC_NCBI_ACC = {
    '1A': '???', '1B': '???', '1D': '???',
    '2A': '???', /* ... */ '7D': '???'
  };
  ```

> ⚠️ 본 브리프 작성 시점에 정확 accession을 검증하지 않았으므로 코드에 추정값을 넣지 않습니다. 실작업 시 NCBI nuccore에서 BioProject로 직접 확인 후 입력해야 합니다.

### 4.3 Q-TARO 등가 — 밀

벼는 Q-TARO 공식 큐레이션 DB가 존재하지만, 밀은 단일 큐레이션 DB가 없고 다음 자료를 합성해야 합니다.

| 자료 | 비고 |
|---|---|
| GrainGenes QTL Reports | USDA-ARS 공식, 가장 큰 큐레이션 |
| Wheat QTL MetaDB (Plant Breeding Reviews 등 메타분석 논문) | 형질별 정리 |
| Komugi (Japan, NBRP-Wheat) | 일본어/영어 양면, 일부 좌표 IWGSC v2 미반영 가능 |

→ **결정 필요**: Q-TARO 위치를 GrainGenes만으로 갈지, 메타분석 paper에서 추출할지. 후자는 cM-bp 변환 작업 추가.

---

## 5. 룰셋 재교정 항목 (`qtl_tool_rules.json`)

현재 룰셋의 12개 키 중 **species 의존**으로 추정되는 항목:

| 키 | Rice 기본값 | 재교정 필요 사유 |
|---|---|---|
| `marker_density.high/mid/low` 임계값 | cM/marker 기준 | 밀 consensus map은 RIL별 편차가 커서 **분포 자체를 다시 봐야 함** |
| `expected_total_cM` (QC 단계) | 1140~1900 cM | 밀: cultivar/패널별 다름. 21 chr 합계 기준 별도 자료 필요 |
| `permutation` 권장 횟수 | 1000 (탐색) / 10000 (출판) | 동일하게 적용 가능 — **재교정 불필요** |
| `LOD_threshold_floor` 2.5 | Lander-Botstein 기반 | 동일 — **재교정 불필요** |
| `walking_step` (저/중/고밀도별 2.0/1.0/0.5 cM) | 마커 평균 간격 의존 | 분포 다시 보고 동일 로직 적용 가능 |

→ **검증 작업**: 밀 reference panel(예: BWMRI 또는 CIMMYT IWWIP RIL) 1~2개로 simulate, 권장값 수정 또는 유지 결정.

---

## 6. 아키텍처 옵션 비교

### 옵션 A — 단일 파일에 species 분기 (권장)

```js
// qtl_tool.html 상단에 단일 객체 추가
const SPECIES_CONFIG = {
  rice: {
    label: '벼 (Oryza sativa)',
    assembly: 'IRGSP-1.0',
    ensembl_species: 'oryza_sativa',
    ensembl_browser: 'ensembl.gramene.org/Oryza_sativa',
    chr_list: ['1','2','3','4','5','6','7','8','9','10','11','12'],
    expected_cM_range: [1140, 1900],
    ncbi_chr_acc: { '1': 'AP014957.1', /* ... */ },
    gene_detail_url: (id) => `https://rapdb.dna.naro.go.jp/viewer/gbrowse_details/irgsp1?name=${id}`,
    qtaro_db: 'qtl_tool_qtaro_subset.json'
  },
  wheat: {
    label: '밀 (Triticum aestivum)',
    assembly: 'IWGSC_RefSeq_v2.1',
    ensembl_species: 'triticum_aestivum',
    ensembl_browser: 'plants.ensembl.org/Triticum_aestivum',
    chr_list: ['1A','1B','1D','2A','2B','2D','3A','3B','3D','4A','4B','4D','5A','5B','5D','6A','6B','6D','7A','7B','7D'],
    expected_cM_range: [/* 검증 필요 */],
    ncbi_chr_acc: { /* 검증 후 작성 */ },
    gene_detail_url: (id) => `https://plants.ensembl.org/Triticum_aestivum/Gene/Summary?g=${id}`,
    qtaro_db: 'qtl_tool_wheat_qtl_subset.json'
  }
};
let CURRENT_SPECIES = 'rice';  // Tab 0에서 사용자 토글
```

| 장점 | 단점 |
|---|---|
| 단일 파일 정책 유지 | 파일 크기 증가 (~5~8 KB 추가 추정) |
| species 추가 시 객체 한 곳만 수정 | 모든 코드 경로가 분기 통과 → QA 매트릭스 2배 |
| 사용자: 한 곳에서 두 종 모두 처리 | UI 토글이 미리 안 들어가면 혼동 위험 |

### 옵션 B — 별도 파일 (`qtl_tool_wheat.html`)

| 장점 | 단점 |
|---|---|
| 기존 rice 동작 절대 영향 없음 (회귀 위험 0) | 코드 중복 ~95% |
| 밀 전용 UI/문구 자연스럽게 작성 | 향후 통계 코어 버그 fix 시 양쪽 동시 수정 필요 |
| 점진 도입(파일럿) 가능 | "유지보수 두 배" 부채 명백 |

### 권장

**1단계: 옵션 B로 PoC (밀 전용 fork) → 2단계: 옵션 A로 병합.** PoC 단계에서 §4의 외부 URL/accession을 실제 검증한 뒤, 검증된 값을 갖고 옵션 A의 `SPECIES_CONFIG`로 머지.

---

## 7. 단계별 로드맵 (제안)

| Phase | 작업 | 산출물 | 검증 |
|---|---|---|---|
| **W1 — 데이터 검증** | NCBI에서 IWGSC RefSeq v2.1 21개 chromosome accession 수집, Ensembl Plants REST로 1A 한 영역 fetch 시도 | `wheat_chr_accession.json`, REST 응답 sample | assembly_name 필드값 캡처 |
| **W2 — Wheat QTL DB subset** | GrainGenes/Wheat MetaDB에서 핵심 50개 QTL/유전자 좌표 추출 (IWGSC v2.1 좌표 통일) | `qtl_tool_wheat_qtl_subset.json` | 좌표 출처 paper DOI 명시 |
| **W3 — PoC (옵션 B)** | `qtl_tool.html` 복제 → species·URL·accession 치환, Tab 6의 외부 DB 링크 GrainGenes/URGI로 교체 | `qtl_tool_wheat.html` | 더미 data로 IM·CIM·permutation 1회 통과 |
| **W4 — 룰셋 재교정** | Wheat 90K reference panel 1개로 simulate → walking_step·expected_cM_range 수정 | `qtl_tool_wheat_rules.json` | validation 스크립트 PASS |
| **W5 — 옵션 A 병합** | `SPECIES_CONFIG` 도입, Tab 0 토글 추가, 두 species 모두 회귀 PASS | `qtl_tool.html` v1.x | 기존 rice 회귀 0건 |
| **W6 — 문서화** | README 다국어 갱신, DEVELOPER_NOTES에 species 분기 패턴 기재 | docs | — |

---

## 8. 미해결/검증 필요 항목 체크리스트

작업 진행 전 반드시 확인해야 할 항목:

- [ ] Ensembl Plants REST가 wheat region 5 Mb 영역을 어느 정도 시간에 응답하는지 (rice는 1~3초)
- [ ] Ensembl Plants `/overlap/region/triticum_aestivum/...` 응답의 `gene_id` 형식 (예: `TraesCS1A02G...`) 안정 deep-link 대상 — Ensembl gene page만으로 충분한지, URGI JBrowse 직링크가 필요한지
- [ ] IWGSC RefSeq v2.1 chromosome accession 21개 확정 (NCBI nuccore에서 BioProject로 검색)
- [ ] GrainGenes QTL list deep-link 안정성 (URL 패턴 변경 이력 검증)
- [ ] Wheat consensus map 총 cM 길이 분포 (룰셋 재교정 기초)
- [ ] Tab 6의 KASP 설계 — wheat homoeolog 간 specificity 보장을 위한 추가 단계 필요 여부 (`.claude/rules/kasp.md`의 §"한국 품종 마커 검증"을 wheat로 일반화)
- [ ] 사용자 인터뷰: 밀 사용자가 실제로 입력 데이터 양식을 어떻게 갖고 있는지 (`A/B/H/-` 그대로인지, KASP score `XX/AA` 같은 형식인지)

---

## 9. 참고 자료 (1차 후보)

- IWGSC (2018) *Science* 361:eaar7191 — RefSeq v1.0
- Zhu T, Wang L, Rimbert H, et al. (2021) *Plant J* — RefSeq v2.1 (확인: 정확한 권/페이지)
- Ensembl Plants — https://plants.ensembl.org/Triticum_aestivum
- URGI Wheat Genome Browser — https://urgi.versailles.inrae.fr/jbrowseiwgsc
- GrainGenes — https://wheat.pw.usda.gov/GG3/
- Wheat Expression Browser (expVIP) — http://www.wheat-expression.com
- WheatOmics 1.0 — http://wheatomics.sdau.edu.cn

---

*작성일: 2026-05-07*
*기준 자료: 본 저장소 `qtl_tool/` v1.2 (PR #320, commit ff4a9d5) 기준*
*상태: 초안(draft) — §8 체크리스트 검증 후 spec 문서로 승격*
