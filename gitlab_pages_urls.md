# GitHub Pages 배포 URL 정리

- 레포 식별자: `olivettirda/rda` (`git remote.origin.url`로 확인)
- 배포 방식: GitHub Pages (워크플로우 파일 부재 → `main` 브랜치 루트 직접 서빙으로 추정)
  - 근거: `experiment-timeline/DEPLOY_GITHUB_PAGES.md` 에 `https://olivettirda.github.io/rda/` 가 공식 URL로 명시됨
- 베이스 URL: `https://olivettirda.github.io/rda/`
- 보조 레포: `olivettirda/label` → 베이스 `https://olivettirda.github.io/label/`
- raw 콘텐츠 베이스: `https://raw.githubusercontent.com/olivettirda/rda/main/`

## URL 표

| 도구 | 파일 | URL | 상태 |
|------|------|-----|------|
| 농업 조사 통합 도구 (생육조사·라벨 통합 앱) | createphenotypingform.html | https://olivettirda.github.io/rda/createphenotypingform.html | ⚠️ 403 (샌드박스 차단) |
| 백그라운드 셀렉션 분석기 | background_selection_v3.HTML | https://olivettirda.github.io/rda/background_selection_v3.HTML | ⚠️ 403 (샌드박스 차단) |
| 디지털육종 시뮬레이터 v5.0 | rice_breeding_v5_0.html | https://olivettirda.github.io/rda/rice_breeding_v5_0.html | ⚠️ 403 (샌드박스 차단) |
| KASP Multi-Gene Analyzer v3 | kasp.html | https://olivettirda.github.io/rda/kasp.html | ⚠️ 403 (샌드박스 차단) |
| 유전자 정보 조회 | gene_database.html | https://olivettirda.github.io/rda/gene_database.html | ⚠️ 403 (샌드박스 차단) |
| HRM 마커 제작 가이드 | HRMguide.html | https://olivettirda.github.io/rda/HRMguide.html | ⚠️ 403 (샌드박스 차단) |
| Claude Code 지침 | CLAUDE.md | https://raw.githubusercontent.com/olivettirda/rda/main/CLAUDE.md | ✅ 200 |
| 라벨 인쇄기 (label 레포) | label_printer.html | https://olivettirda.github.io/label/label_printer.html | ⚠️ 403 (샌드박스 차단) |

## 참고: 검증 방법 및 한계

- 검증 명령: `curl -I -L --max-time 15 <URL>` (HEAD 요청, 본문 미수신)
- `raw.githubusercontent.com/...CLAUDE.md` → **200 OK** 확인
- 모든 `*.github.io` URL → **403** 응답
  - 비교 검증: `https://pages.github.com/`, `https://github.io/` 도 동일하게 **403** → **현재 실행 환경(샌드박스)에서 `*.github.io` 도메인 자체가 차단**된 것으로 판정
  - 실제 브라우저/외부 환경에서는 정상 접근 가능할 가능성이 높음
- 실 배포 확인이 필요한 경우 다음 중 하나로 검증:
  ```
  gh api repos/olivettirda/rda/pages
  curl -I https://olivettirda.github.io/rda/
  ```

## 파일 존재 확인 (저장소 기준)

| 파일 | 저장소 main 존재 | 비고 |
|------|------------------|------|
| createphenotypingform.html | ✅ | 로컬 + MCP `get_file_contents` 확인 |
| background_selection_v3.HTML | ✅ | **확장자가 대문자 `.HTML`** (URL도 대소문자 일치 필요) |
| rice_breeding_v5_0.html | ✅ | |
| kasp.html | ✅ | |
| gene_database.html | ✅ | |
| HRMguide.html | ✅ | |
| CLAUDE.md | ✅ | raw 200 검증 완료 |
| label_printer.html | ⚠️ 미확인 | `olivettirda/label` 은 MCP 권한 외 → 직접 확인 불가 |
