# prompt_logic_3.md — 출품 도구 5종 변경 PR 의 실제 프롬프트 패턴

추출 방법: `git log --grep="Merge pull request"` → 출품 도구 5종(createphenotypingform / background_selection / rice_breeding / kasp / label_printer) 관련 브랜치만 선별 → MCP `pull_request_read get` 으로 본문 앞부분만 확인. sticky_notes·gel-analysis·pdf-password 등 무관 PR 제외.

| PR# | 작업 유형 | 프롬프트 발췌 (한 줄) | 구조 |
|---|---|---|---|
| #281 | 신규 기능 | "시뮬레이터의 모든 탭을 즉시 체험할 수 있도록 한국 밀양 육성 11품종 × 31유전자(전 12염색체) × 9표현형 데모 데이터셋을 추가" (rice_breeding) | 입력(품종·유전자·표현형 차원) + 알고리즘(NSGA-II 파레토, F1~F7 세대 진전) + 출력(5시트 XLSX) |
| #276 | 방향 전환 | "Replaced simple vertical lines with L-shaped connectors (elbow connectors) for marker labels" + Donor/Recurrent/recovery threshold 도움말 툴팁 (background_selection) | 변경 사유 명시(가독성·시각적 혼잡 감소) + 도메인 용어(donor/recurrent/recovery) |
| #245 | 절충안 | "Inline all BDSS JavaScript modules + Python statistical engine (BLUP, WAASB, WAASBY, MTSI) into HTML — works standalone without src/ folder" (rice_breeding) | 변경 사유 명시(휴대성/단일 파일) + 도메인 용어(BLUP·MTSI·CMS/Rf·MAS) |
| #265 | 신규 기능 | ".xlsx, .xls 파일 업로드 지원 — XLSX 라이브러리로 Excel→CSV 변환 후 파싱, 기존 CSV/TSV/TXT 도 계속 지원" (background_selection 마커 입력) | 입력(파일 형식 확장) + 전처리(Excel→CSV 변환) — 하위 호환 명시 |
| #258 | 절충안 | "captureChromosomeVizAsBlob 함수 완전 재작성 — DOM 복제 방식에서 데이터 기반 직접 생성 방식으로 변경, 화면에 표시되지 않은 샘플도 정상 캡처" (background_selection) | 직전 구현 인용("DOM 복제 방식에서") + 변경 사유(미표시 샘플 캡처 실패) |
| #241 | 신규 기능 | "Add enhanced progress panel — Show current generation name and phase description (F1, BC1-n, selfing), display estimated remaining time" (rice_breeding) | 출력(UI 패널) + 도메인 용어(F1·BC1·selfing 세대 진전) |
| #274 | 버그 수정 | "fix-chromosome-visualization" 브랜치 7회 반복(#269–#275) — 마커 위치 표시 개선: 공여친/이형접합만 표시, 공유 눈금 상단 배치 (background_selection) | 직전 PR 인용(같은 브랜치 7회 후속) + 도메인 용어(공여친·이형접합) |

## 메모

- **createphenotypingform / kasp / label_printer**: `git log --merges` 와 브랜치명 키워드(phenotyping/kasp/label/print) 검색에서 직접 매칭되는 PR 본문이 발견되지 않음. 변경이 다른 PR 에 묻혀 들어갔거나 별도 저장소 가능성. 추측 금지 규칙으로 미기재.
- **본문 발췌**는 각 PR `pull_request_read` 응답의 첫 500자 이내에서만 인용 (규칙 준수).
- **rice_breeding 관련 브랜치 군집**: `analyze-rice-breeding-app` (#238–#242), `rice-breeding-prediction` (#243–#245), `enhance-breeding-simulation` (#278–#281), `famd-rice-breeding-integration` (#251–#252) → 같은 도구에 대해 반복 작업. 동일 브랜치에서 여러 PR 이 나오는 패턴이 "직전 PR 인용" 구조의 전형.
- **background_selection 관련 브랜치 군집**: `chromosome-marker-visualization` (#267–#268), `auto-convert-sequencing-data` (#255–#266), `fix-chromosome-visualization` (#269–#275), `improve-marker-labels` (#276) → 시각화 개선 반복.
