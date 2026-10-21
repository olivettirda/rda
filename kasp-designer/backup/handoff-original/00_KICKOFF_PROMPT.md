# 클로드코드 킥오프 프롬프트 (이 아래 내용을 그대로 붙여넣으세요)

---

이 폴더를 프로젝트 루트로 삼아 **한국어 UI의 KASP/AS-PCR 프라이머 설계 웹앱**을 만들어 주세요.

먼저 아래 순서로 읽고 시작하세요.
1. `CLAUDE.md` — 응대·코딩 규칙, 저작권 원칙, 기술 스택
2. `docs/ALGORITHM_SPEC.md` — 설계 알고리즘 사양 (Tm, LC, 다이머, 마스킹, ASP/Common 설계 흐름)
3. `docs/DESIGN_GUIDE.md` — Apple-simple 디자인 규칙
4. `docs/TASKS.md` — Phase 0~5 작업 순서
5. `reference/tm.js` 실행(`node reference/tm.js`) → Tm 기준값 확인, `reference/test_cases.json` 예제 확인

핵심 요구사항 요약
- 결과물은 더블클릭으로 오프라인 동작하는 **단일 HTML**(`dist/kasp-designer.html`). 개발은 `src/` 모듈 + 빌드 스크립트.
- 알고리즘은 primerdigital.com KASP 도구와 **같은 원리**(SantaLucia 1998 + Owczarzy 염보정, linguistic complexity, 5-mer 시드 다이머, 15-mer 반복 마스킹)이되, 외부 코드는 한 줄도 복사하지 않고 사양서와 문헌만 보고 **클린룸 재구현**.
- Tm 기본 프리셋은 **바이오니어**(50 mM Na⁺, 250 nM, 15 nt 미만 Wallace rule). primerdigital 조건(55 mM Na⁺/1 mM Mg²⁺/200 nM)은 비교용 토글.
- **Tm은 반드시 tail 제거 후 계산**. 출력표에는 tail 포함 전체 서열과 tail 제외 Tm을 같이.
- 디자인: 여백 많고 장식 없는 Apple 스타일, 라이트/다크 자동, Pretendard 폰트, 서열은 mono, accent 색은 `#017f97` 하나만.

진행 방식
- Phase 0부터 시작해 **각 Phase가 끝날 때마다 멈추고** `docs/TASKS.md`의 보고 형식으로 결과(테스트 통과 수, 확인한 수치)를 보고한 뒤 다음 Phase로 가세요.
- Phase 1(코어)은 브라우저 없이 `node --test`로 전부 검증한 뒤에만 UI로 넘어가세요.
- 확실하지 않은 생물학적 판단(예: 3′ 말단 미스매치 처리 방식)은 추측하지 말고 질문하세요.
- 존댓말로 답하고, 결론을 먼저 말해 주세요.

---

## (참고) 넘기기 전 사용자가 확인할 것
- 폴더 전체를 PC로 복사한 뒤 그 폴더에서 `claude` 실행 → 위 프롬프트 붙여넣기.
- 클로드코드가 CLAUDE.md를 자동으로 읽으므로 규칙은 세션 내내 유지됩니다.
