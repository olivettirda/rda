# CLAUDE.md — KASP 디자이너 프로젝트

## 응대 규칙
- 항상 존댓말. 결론을 첫 문장에.
- 유전학·분자육종 관련 답은 사실 기반으로만, 추론 금지. 모르면 질문.
- 계산 수치는 추정하지 않는다. `reference/tm.js`로 직접 실행해 확인.
- 코드 수정 시 기존 기능 삭제 금지 — 추가 또는 지정 부분만 수정.
- 긴 파일은 단계별로 나누어 작성. 작업 전 원본을 `backup/` 에 복사.
- 매 단계 끝에 테스트 실행(`npm test`) 후 결과 보고.

## 프로젝트 목적
primerdigital.com KASP 도구와 **같은 원리**로 동작하는, 한국어 UI의 단일 HTML KASP/AS-PCR 프라이머 설계 앱.
원리 사양: `docs/ALGORITHM_SPEC.md` (반드시 먼저 읽을 것). 디자인: `docs/DESIGN_GUIDE.md`. 작업 순서: `docs/TASKS.md`.

## 저작권 원칙
- 분석 대상이었던 외부 JS는 참고 자료일 뿐이다. **한 줄도 복사하지 않는다.** 함수 이름·변수 구조도 따라 하지 않는다.
- 공개 문헌(SantaLucia 1998, Owczarzy 2004/2008 등)의 수식과 `docs/ALGORITHM_SPEC.md`만 보고 새로 작성한다.

## 기술 스택
- 결과물: `dist/kasp-designer.html` **단일 파일**(CSS·JS 인라인, 외부는 CDN만: Pretendard, Lucide, SheetJS).
- 개발 구조: `src/` 모듈(ES modules) → `scripts/build.js`로 하나의 HTML로 번들(의존성 없이 Node 내장만 사용, 또는 esbuild 허용).
- 테스트: Node 내장 `node:test`. `tests/` 아래, 브라우저 없이 코어 로직만.
- 외부 서버 호출 없음(Ensembl/NCBI rsID 조회는 Phase 4 옵션).

## 코어 모듈 (src/core/)
| 파일 | 역할 |
|---|---|
| `seq.js` | 정제, 역상보, IUPAC 확장, GC% |
| `tm.js` | SantaLucia+Owczarzy, Wallace, 프리셋 (`reference/tm.js`와 동일 결과여야 함) |
| `complexity.js` | LC%, 단순반복 검사 |
| `dimer.js` | 5-mer 시드 역평행 다이머 검사 |
| `mask.js` | 15-mer 반복 마스킹, 17-nt 저복잡도 마스킹, 제외구역 |
| `parse.js` | FASTA/괄호 마크업 파싱 |
| `design.js` | ASP + Common 설계, Forward/Reverse, amplicon |
| `sizing.js` | Allele sizing 모드 |
| `export.js` | TSV, xlsx(주문용/설계근거 시트) |

## 사용자 표준 (벼 분자육종)
- Tail: FAM `GAAGGTGACCAAGTTCATGCT`, HEX `GAAGGTCGGAGTCAACGGATT` (LGC).
- ASP/Common 18–25 nt, Tm 57–62 °C(tail 제외), 차이 ±3 °C, GC 40–60 %, amplicon 50–150 bp(최대 300).
- Tm 기본 프리셋 = 바이오니어(50 mM Na⁺, 250 nM, 15 nt 미만 Wallace).
- 유전체 좌표 표기 IRGSP-1.0 `ChrXX:bp`.
- 폰트/컬러칩: `docs/DESIGN_GUIDE.md` §2–3.

## 완료 기준
1. `tests/` 전부 통과, `reference/test_cases.json`의 예제가 설계 성공.
2. `dist/kasp-designer.html` 더블클릭으로 오프라인 동작.
3. 라이트/다크, 데스크톱/모바일 확인 스크린샷 4장.
