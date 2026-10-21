# 작업 순서 (Phase별 — 각 Phase 끝에서 테스트 통과 후 다음으로)

## Phase 0 — 준비 (30분)
- [ ] `docs/ALGORITHM_SPEC.md`, `docs/DESIGN_GUIDE.md`, `CLAUDE.md` 정독
- [ ] `node reference/tm.js` 실행해 기준 Tm 값 확인
- [ ] 폴더 생성: `src/core`, `src/ui`, `tests`, `scripts`, `dist`, `backup`
- [ ] `package.json` (`"test": "node --test tests/"`, `"build": "node scripts/build.js"`)

## Phase 1 — 코어 (브라우저 없이 완성)
- [ ] `seq.js` + 테스트 (역상보, IUPAC 전개 `[R]`→A,G, InDel 빈 allele)
- [ ] `tm.js` + 테스트: `reference/tm.js` 6개 서열과 ±0.05 °C 이내 일치
- [ ] `complexity.js` + 테스트 (`AAAAAAAAAAAAAAAAAAAA` LC<30, 랜덤 20-mer LC≥80)
- [ ] `dimer.js` + 테스트 (완전 상보 6-mer 공유 → 양성, 무관 서열 → 음성)
- [ ] `mask.js` + 테스트 (15-mer 2회 반복 삽입 서열 → 해당 구간 마스킹)
- [ ] `parse.js` + 테스트 (`reference/test_cases.json` 4가지 형식 모두 파싱)
- [ ] `design.js` + 테스트: 예제 SNP에서 ASP 2개 + Common ≥1개, Tm 범위 내, amplicon 계산 일치
- [ ] CLI 데모 `scripts/demo.js`: FASTA 파일 → 콘솔 TSV 출력

## Phase 2 — UI 골격
- [ ] `src/ui/app.html` 레이아웃(사이드바/콘텐츠/상단바), CSS 변수, 다크모드
- [ ] 서열 입력 화면 + 실시간 요약 + 괄호 하이라이트 + 예제 불러오기
- [ ] 설계 조건 폼(기본/고급 disclosure), Tm 프리셋 세그먼트
- [ ] Tail 탭(FAM/HEX 기본값, 편집 가능)
- [ ] "프라이머 설계" 버튼 → `design.js` 호출 → 결과 카드 렌더
- [ ] `scripts/build.js`로 단일 HTML 생성 확인

## Phase 3 — 결과·내보내기
- [ ] 결과 세트 카드(Forward/Reverse 세그먼트, Tm 배지, tail 색 구분, 변이 염기 강조)
- [ ] 서열 뷰어(프라이머 위치 막대, SNP 세로선)
- [ ] 복사(TSV), 엑셀 다운로드(SheetJS, 주문용/설계근거 2시트, 스타일 적용)
- [ ] 경고 패널(ASP–Common Tm 차 >3, amplicon 범위 밖, 다이머, tail 부족)

## Phase 4 — 옵션 기능
- [ ] Allele sizing 모드(겔 판독) — `sizing.js`
- [ ] Bisulfite C→T
- [ ] rsID 조회(Ensembl/NCBI) — 벼는 Ensembl Plants `oryza_sativa`; 외부 호출 실패 시 조용히 안내
- [ ] 여러 마커 일괄 설계 + 일괄 엑셀

## Phase 5 — 마무리
- [ ] 라이트/다크 × 데스크톱/모바일 스크린샷 4장
- [ ] README(한국어): 사용법, 원리 요약, 인용
- [ ] `backup/` 정리, 버전 태그 v1.0

---

## 결과 보고 형식 (각 Phase 끝)
```
Phase N 완료
- 생성/수정 파일: ...
- 테스트: X passed / Y failed
- 확인한 수치: (예) FAM tail 본체 Tm 바이오니어 54.2 °C, primerdigital 60.1 °C
- 미해결: ...
```
