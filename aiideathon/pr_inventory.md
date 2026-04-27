# PR 전체 인벤토리 (olivettirda/rda)

**작업1 산출물** — 닫힌 PR 274건 (PR #1 ~ #281, 누락 7건은 삭제·취소된 PR로 추정).

- 모든 PR이 `olivettirda/claude/...` 브랜치에서 생성·머지 → **전 PR이 Claude Code 협업의 산물**.
- `+/-라인` 및 `주요 변경 파일` 컬럼은 **로컬 git log 머지커밋 기반**으로 산출. PR #1~#232는 squash 머지로 머지커밋이 로컬에 없어 `(데이터 부족)`으로 표기.

| PR# | 제목 | 머지일 | +라인 | -라인 | 주요 변경 파일 | 분류 |
|-----|------|--------|-------|-------|----------------|------|
| 281 | 밀양 육성 11품종 전과정 데모 데이터 추가 | 2026-04-17 | 289 | 0 | demo_data_miryang.js, rice_breeding_v5_0.html | [NEW] |
| 280 | CLAUDE.md: 머지 규칙을 모드별로 분기 | 2026-04-17 | 4 | 3 | CLAUDE.md | [DOC] |
| 279 | CLAUDE.md: PR 머지는 사용자 확인 후 수행 규칙 추가 | 2026-04-17 | 9 | 0 | CLAUDE.md | [DOC] |
| 278 | 유전자 연구 메타데이터 레이어 + 연구 브라우저 탭 | 2026-04-17 | 1196 | 3 | CLAUDE.md 외 2개 | [NEW] |
| 277 | Improve Service Worker caching strategy for HTML files | 2026-02-26 | 79 | 16 | .nojekyll 외 2개 | [FIX] |
| 276 | Add elbow connectors, help tooltips, and grid interval co... | 2026-02-06 | 341 | 100 | background_selection_v3.HTML | [NEW] |
| 275 | 염색체 필터 UI 개선: 샘플 버튼 스타일 적용 및 레이아웃 정돈 | 2026-02-06 | 25 | 32 | background_selection_v3.HTML | [FIX] |
| 274 | Claude/fix chromosome visualization z bn4y | 2026-02-06 | 460 | 61 | background_selection_v3.HTML | [FIX] |
| 273 | Claude/fix chromosome visualization z bn4y | 2026-02-06 | 139 | 99 | background_selection_v3.HTML | [FIX] |
| 272 | 마커 라벨 위치 매핑 개선: 물리적 위치 기반 정확한 배치 | 2026-02-06 | 102 | 78 | background_selection_v3.HTML | [FIX] |
| 271 | 염색체 시각화를 메인 탭으로 복원, 옵션만 플로팅 창으로 분리 | 2026-02-06 | 101 | 171 | background_selection_v3.HTML | [REVERT] |
| 270 | 시각화 패널을 드래그 가능한 플로팅 창으로 변경, X축 눈금 개선 | 2026-02-06 | 243 | 386 | background_selection_v3.HTML | [FIX] |
| 269 | Refactor visualization into floating right-side drawer panel | 2026-02-06 | 647 | 153 | background_selection_v3.HTML | [FIX] |
| 268 | 시각화 설정을 플로팅 패널로 변경 | 2026-02-06 | 492 | 137 | background_selection_v3.HTML | [NEW] |
| 267 | Add chromosome filtering, cM map units, and marker label ... | 2026-02-05 | 613 | 105 | background_selection_v3.HTML | [NEW] |
| 266 | 파비콘 및 로고 경로 수정 | 2026-02-05 | 2 | 2 | background_selection_v3.HTML | [FIX] |
| 265 | Excel 파일 형식 지원 추가 | 2026-02-05 | 27 | 5 | background_selection_v3.HTML | [NEW] |
| 264 | 제목 및 아이콘 변경 | 2026-02-05 | 3 | 3 | background_selection_v3.HTML | [NEW] |
| 263 | Claude/auto convert sequencing data a vigs | 2026-02-05 | 262 | 22 | background_selection_v3.HTML | [NEW] |
| 262 | 염색체 내보내기 선택 UI 개선 | 2026-02-05 | 33 | 31 | background_selection_v3.HTML | [NEW] |
| 261 | 염색체 시각화 내보내기 개선 및 선택 기능 추가 | 2026-02-05 | 182 | 45 | background_selection_v3.HTML | [NEW] |
| 260 | Claude/auto convert sequencing data a vigs | 2026-02-05 | 22 | 3 | background_selection_v3.HTML | [NEW] |
| 259 | 차트 이미지 내보내기 리사이즈 개선 | 2026-02-05 | 117 | 38 | background_selection_v3.HTML | [NEW] |
| 258 | 염색체 시각화 캡처 방식 개선 | 2026-02-05 | 84 | 60 | background_selection_v3.HTML | [NEW] |
| 257 | 차트 시각화 개선 | 2026-02-05 | 202 | 87 | background_selection_v3.HTML | [NEW] |
| 256 | 이미지 내보내기 기능 개선 | 2026-02-05 | 205 | 54 | background_selection_v3.HTML | [NEW] |
| 255 | Add target capture sequencing data conversion and templat... | 2026-02-05 | 858 | 19 | background_selection_v3.HTML | [NEW] |
| 254 | Fix PDF password remover to use PDF.js | 2026-02-03 | 159 | 53 | pdf-password-remover/index.html | [FIX] |
| 253 | Add PDF password remover web app | 2026-02-03 | 874 | 0 | pdf-password-remover/index.html | [NEW] |
| 252 | Reorganize FAMD module into separate subfolder | 2026-01-30 | 47 | 3 | bdss_core/__init__.py 외 3개 | [NEW] |
| 251 | Add FAMD (Factor Analysis of Mixed Data) engine for rice ... | 2026-01-30 | 1622 | 0 | bdss_core/__init__.py 외 2개 | [NEW] |
| 250 | Enhance gel_analyzer.html with expanded functionality | 2026-01-28 | 1562 | 90 | gel_analyzer.html | [NEW] |
| 249 | Expand image converter with format conversion, ICO genera... | 2026-01-28 | 768 | 114 | image_compressor.html | [NEW] |
| 248 | Fix service worker cache paths to use relative URLs | 2026-01-27 | 11 | 11 | sticky_notes_app/sw.js | [FIX] |
| 247 | Fix 404 errors on app startup by using relative paths | 2026-01-27 | 4 | 4 | sticky_notes_app/manifest.json, sticky_notes_ap... | [FIX] |
| 246 | Improve auto-arrange layout to preserve manual positioning | 2026-01-27 | 124 | 88 | sticky_notes_app/stickynote.html | [NEW] |
| 245 | Integrate BDSS modules inline for portable single-file ex... | 2026-01-26 | 1137 | 21 | rice_breeding_v4_16_prediction.html | [NEW] |
| 244 | Add BDSS modular JavaScript/Python integration layer | 2026-01-26 | 4783 | 0 | src/INTEGRATION_GUIDE.md 외 8개 | [NEW] |
| 243 | feat: Initialize BDSS Core module with breeding simulatio... | 2026-01-26 | 5179 | 0 | bdss_core/__init__.py 외 12개 | [NEW] |
| 242 | Claude/analyze rice breeding app 8 h hx c | 2026-01-26 | 383 | 21 | rice_breeding_v4_16_prediction.html | [NEW] |
| 241 | Enhance simulation progress indicator with detailed phase... | 2026-01-26 | 107 | 13 | rice_breeding_v4_16_prediction.html | [NEW] |
| 240 | Add pagination to offspring prediction results table | 2026-01-26 | 62 | 22 | rice_breeding_v4_16_prediction.html | [NEW] |
| 239 | Claude/analyze rice breeding app 8 h hx c | 2026-01-26 | 309 | 16 | rice_breeding_v4_16_prediction.html | [NEW] |
| 238 | Claude/analyze rice breeding app 8 h hx c | 2026-01-26 | 85 | 77 | rice_breeding_v4_16_prediction.html | [NEW] |
| 237 | Claude/restore desktop features 4e1c r | 2026-01-22 | 182 | 17 | sticky_notes_app/stickynote.html | [NEW] |
| 236 | Disable auto-arrange on load to preserve manual note posi... | 2026-01-22 | 11 | 8 | sticky_notes_app/stickynote.html | [NEW] |
| 235 | Improve masonry layout to handle collapsed notes correctly | 2026-01-22 | 23 | 11 | sticky_notes_app/stickynote.html | [NEW] |
| 234 | Fix PWA 404 errors and improve masonry layout for variabl... | 2026-01-21 | 83 | 32 | sticky_notes_app/stickynote.html, sticky_notes_... | [FIX] |
| 233 | Add system font option and fix layout issues | 2026-01-21 | 36 | 31 | sticky_notes_app/stickynote.html | [FIX] |
| 232 | Fix masonry layout to use default note width | 2026-01-21 | ? | ? | (데이터 부족) | [FIX] |
| 231 | Implement masonry layout for note arrangement | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 230 | Fix button icons and unify colors | 2026-01-21 | ? | ? | (데이터 부족) | [FIX] |
| 229 | Improve UI: darker background, button colors, and arrange... | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 228 | Claude/restore desktop features 4e1c r | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 227 | Claude/restore desktop features 4e1c r | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 226 | Fix note repositioning and first-line preview extraction | 2026-01-21 | ? | ? | (데이터 부족) | [FIX] |
| 225 | Increase collapsed width to 210px and add DB migration | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 224 | Improve collapsed note layout with first-line preview | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 223 | Add note collapse/expand functionality | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 222 | Claude/restore desktop features 4e1c r | 2026-01-21 | ? | ? | (데이터 부족) | [NEW] |
| 221 | Fix profile avatar styling in header | 2026-01-21 | ? | ? | (데이터 부족) | [FIX] |
| 220 | Fix PWA 404 error on auto-start by using absolute paths | 2026-01-21 | ? | ? | (데이터 부족) | [FIX] |
| 219 | Add security features: auto-login, password change, and a... | 2026-01-20 | ? | ? | (데이터 부족) | [NEW] |
| 218 | Add web deployment and mobile UX improvements | 2026-01-20 | ? | ? | (데이터 부족) | [NEW] |
| 217 | Simplify RLS policies to fix infinite recursion error | 2026-01-20 | ? | ? | (데이터 부족) | [FIX] |
| 216 | Claude/experiment timeline app j tcmp | 2026-01-20 | ? | ? | (데이터 부족) | [NEW] |
| 215 | Add Supabase integration with authentication | 2026-01-20 | ? | ? | (데이터 부족) | [NEW] |
| 214 | Add experiment timeline manager web application | 2026-01-18 | ? | ? | (데이터 부족) | [NEW] |
| 213 | claude/rice-breeding-v5-upgrade-Taekj | 2026-01-16 | ? | ? | (데이터 부족) | [NEW] |
| 212 | Fix 4 critical QA bugs for mobile touch interactions | 2026-01-14 | ? | ? | (데이터 부족) | [FIX] |
| 211 | Reduce top margin and add font selection feature | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 210 | Claude/restore desktop features 4e1c r | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 209 | Add Excel export and mobile-specific manual | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 208 | Restore all desktop features to mobile version | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 207 | Claude/restore desktop features 4e1c r | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 206 | Claude/restore desktop features 4e1c r | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 205 | Claude/restore desktop features 4e1c r | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 204 | Add desktop features to mobile stickynote app | 2026-01-13 | ? | ? | (데이터 부족) | [NEW] |
| 203 | Add date/time display and change default font to Nanum Ba... | 2026-01-13 | ? | ? | (데이터 부족) | [FIX] |
| 202 | Fix integer type errors and PWA path issues | 2026-01-13 | ? | ? | (데이터 부족) | [FIX] |
| 201 | Fix supabase identifier conflict in mobile web app | 2026-01-13 | ? | ? | (데이터 부족) | [FIX] |
| 200 | Apply DMRT color scheme and add single instance lock | 2026-01-13 | ? | ? | (데이터 부족) | [FIX] |
| 199 | Fix duplicate showLogin identifier and add mobile-web-app... | 2026-01-13 | ? | ? | (데이터 부족) | [FIX] |
| 198 | Claude/fix build version issue q z sus | 2026-01-13 | ? | ? | (데이터 부족) | [FIX] |
| 197 | Force cache refresh with timestamp | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 196 | Fix color palette and paths for mobile stickynote app | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 195 | Optimize stickynote for mobile with icon.png and proper e... | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 194 | Copy desktop Electron app (index.html) to web version (st... | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 192 | Update portfolio with complete development history | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 191 | Add all desktop features to mobile stickynote app | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 190 | Fix mobile app to use same Supabase server as desktop | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 189 | Rename mobile.html to stickynote.html | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 188 | Claude/fix build version issue q z sus | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 187 | Add profile name and organization editing | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 186 | Add comprehensive project portfolio documentation | 2026-01-12 | ? | ? | (데이터 부족) | [DOC] |
| 185 | Major UI overhaul: Profile modal, signup improvements, an... | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 184 | 예약 시스템 템플릿 가이드 추가 | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 183 | Add organization field to user profiles | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 182 | Claude/lab booking page address 8u bz h | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 181 | Claude/fix build version issue q z sus | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 180 | Claude/lab booking page address 8u bz h | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 179 | Improve note editing UX | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 178 | 연구실을 필수 항목으로 변경 및 위치를 선택사항으로 변경 | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 177 | asset_no 필드 제거 및 실험실 목록 동적 로드 구현 | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 176 | Claude/fix build version issue q z sus | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 175 | Use icon32.ico for titlebar icon instead of emoji | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 174 | Excel 업로드 장비 추가 오류 수정 및 디버그 로그 개선 | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 173 | Claude/fix build version issue q z sus | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 172 | Add NSIS script to force-close app before install, bump t... | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 171 | Fix build version caching issue | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 170 | Fix build: output to dist folder, simplify clean script | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 169 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 168 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 167 | Set icon opacity to 60%, full opacity on hover | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 166 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 165 | Add sidebar mode improvements and UI enhancements | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 164 | 다일 예약 캘린더 표시 개선 및 이벤트 핸들러 수정 | 2026-01-12 | ? | ? | (데이터 부족) | [FIX] |
| 163 | Claude/lab booking html edit ag srh | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 162 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 161 | Use icon32.ico for tray icon instead of full size icon.ico | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 160 | Add user&#39;s properly sized icon files from main branch | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 159 | Clear icon folders for user to upload proper sized icons | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 158 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 157 | Update Supabase config to use nano project | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 156 | Redesign sticky notes app with DMRT design system | 2026-01-12 | ? | ? | (데이터 부족) | [REFACTOR] |
| 155 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 154 | Change build output to same folder as batch file | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 153 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 152 | Claude/floating sticky notes app g547 e | 2026-01-12 | ? | ? | (데이터 부족) | [NEW] |
| 151 | 당일 시간 선택 헤더에 종료 시간 표시 추가 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 150 | 다일 예약 시간 처리 버그 수정 | 2026-01-09 | ? | ? | (데이터 부족) | [FIX] |
| 149 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 148 | 공휴일 API 연동 및 스타일 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 147 | 한국 공휴일 표시 기능 추가 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 146 | 캘린더 예약 표시 시스템 대폭 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 145 | 달력 불필요한 행 제거 (동적 행 수 계산) | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 144 | 실험실 명칭 변경 및 DB 마이그레이션 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 143 | 예약 시스템 UI/DB 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 142 | 시간 선택 헤더 레이아웃 통일 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 141 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 140 | UI 및 디버깅 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 139 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 138 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 137 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 136 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 135 | UI 및 기능 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 134 | Claude/lab booking enhancements yto na | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 133 | 예약 모달 및 시간 선택 UI 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 132 | 사용 매뉴얼 업데이트 - 신규 기능 반영 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 131 | 날짜 선택 버그 수정 및 시간 예약 기능 대폭 개선 | 2026-01-09 | ? | ? | (데이터 부족) | [FIX] |
| 130 | 위치 드롭다운 통합 및 예약현황/내 예약 버그 수정 | 2026-01-09 | ? | ? | (데이터 부족) | [FIX] |
| 129 | 캘린더 개선: 토/일 색상, 월 넘어 선택, 시간 7시부터, 야간 옵션 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 128 | 장비 목록을 위치별 그룹화 테이블 형식으로 변경 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 127 | 실험 위치 드롭다운 + 캘린더 예약 상세정보/취소 기능 추가 | 2026-01-09 | ? | ? | (데이터 부족) | [NEW] |
| 126 | 예약 UI 재구성: 캘린더 좌측, 실험정보 우측 + 장비 의존성 제거 | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 125 | 캘린더에 구글 캘린더 스타일 예약 표시 추가 | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 124 | 실험 기반 예약 시스템으로 전면 개편 | 2026-01-08 | ? | ? | (데이터 부족) | [REFACTOR] |
| 123 | 장비등록신청 양식을 관리자 양식과 동일하게 통일 | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 122 | Claude/lab booking enhancements yto na | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 121 | Add lab booking application history and improvements | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 120 | 비밀번호 아이콘 수정: 기본=disclose(보기), 드러낸 후=close(숨기기) | 2026-01-08 | ? | ? | (데이터 부족) | [FIX] |
| 119 | Claude/lab booking html edit ag srh | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 118 | Claude/lab booking html edit ag srh | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 117 | 관리자 설정 기능 추가 | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 116 | Edit HTML for lab booking web app | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 115 | Edit HTML for lab booking web app | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 114 | Edit HTML for lab booking web app | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 113 | Edit HTML for lab booking web app | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 112 | Edit HTML for lab booking web app | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 111 | Design lab equipment reservation booking system | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 110 | 3K Rice Genomes SNP-Seek 데이터 연동 기능 추가 | 2026-01-08 | ? | ? | (데이터 부족) | [NEW] |
| 108 | 탄가시장 가이드를 5끼 메뉴 버전으로 전면 개편 | 2026-01-03 | ? | ? | (데이터 부족) | [REFACTOR] |
| 107 | 일본 웹 레시피 참고 자료 섹션 추가 | 2026-01-02 | ? | ? | (데이터 부족) | [NEW] |
| 106 | 탄가시장 자취요리 2박3일 가이드 웹 페이지 추가 | 2026-01-02 | ? | ? | (데이터 부족) | [NEW] |
| 104 | Systematize existing web applications | 2025-12-24 | ? | ? | (데이터 부족) | [NEW] |
| 103 | Systematize existing web applications | 2025-12-24 | ? | ? | (데이터 부족) | [NEW] |
| 102 | Systematize existing web applications | 2025-12-24 | ? | ? | (데이터 부족) | [NEW] |
| 101 | Build data format converter web application | 2025-12-24 | ? | ? | (데이터 부족) | [NEW] |
| 99 | funRiceGenes 전체 데이터 통합 및 검색 기능 강화 | 2025-12-23 | ? | ? | (데이터 부족) | [NEW] |
| 98 | Integrate marker designer and workbench tools | 2025-12-23 | ? | ? | (데이터 부족) | [NEW] |
| 97 | Claude/molecular marker design app n vg lh | 2025-12-23 | ? | ? | (데이터 부족) | [NEW] |
| 96 | Create comprehensive UI/UX design guide | 2025-12-23 | ? | ? | (데이터 부족) | [NEW] |
| 95 | Molecular marker design web application | 2025-12-23 | ? | ? | (데이터 부족) | [NEW] |
| 94 | 종자 분석기 색상 감지 로직 복원 (성능 저하 해결) | 2025-12-22 | ? | ? | (데이터 부족) | [REVERT] |
| 93 | 종자 분석기 핵심 기능 개선 | 2025-12-22 | ? | ? | (데이터 부족) | [FIX] |
| 92 | Fix seed color detection with repeated iterations | 2025-12-22 | ? | ? | (데이터 부족) | [FIX] |
| 91 | RAP-DB 브라우저 UI 개선 | 2025-12-22 | ? | ? | (데이터 부족) | [NEW] |
| 90 | RAP-DB 브라우저 버그 수정 | 2025-12-22 | ? | ? | (데이터 부족) | [FIX] |
| 89 | 시뮬레이터에 유전자 예측 및 제안 기능 추가 (v5.0) | 2025-12-22 | ? | ? | (데이터 부족) | [NEW] |
| 88 | Build RAP-DB integration module for rice breeding | 2025-12-22 | ? | ? | (데이터 부족) | [NEW] |
| 87 | 이미지 분석기 색상 추출 개별 샘플 재추출 기능 추가 | 2025-12-18 | ? | ? | (데이터 부족) | [FIX] |
| 86 | 이미지 분석기 종자 분리 기능 대폭 강화 | 2025-12-18 | ? | ? | (데이터 부족) | [NEW] |
| 85 | 이미지 분석기 색상 추출 기능 개선: 10회 반복 샘플 개별 표시 및 관리 | 2025-12-18 | ? | ? | (데이터 부족) | [NEW] |
| 84 | 이미지 분석기 종자 탐지 기능 강화 | 2025-12-17 | ? | ? | (데이터 부족) | [NEW] |
| 83 | 이미지 분석기에 플랫 필드 보정 기능 추가 및 색상 선택 개선 | 2025-12-17 | ? | ? | (데이터 부족) | [FIX] |
| 81 | 이미지 분석기에 플랫 필드 보정 기능 추가 및 색상 선택 개선 | 2025-12-17 | ? | ? | (데이터 부족) | [NEW] |
| 80 | 각 탭에 폴더 저장 기능 추가 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 79 | 이미지 크기조절기를 농업 조사 통합 도구 프레임 안에 통합 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 78 | 앱 제목을 &#39;이미지 크기 조절기&#39;로 변경 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 77 | 이미지 압축기 다운로드 기능 개선 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 76 | 이미지 압축기 컬러칩을 기존 웹앱과 통일 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 75 | 농업 조사 통합 도구에 이미지 압축 링크 추가 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 74 | 이미지 일괄 압축 웹앱 추가 | 2025-12-15 | ? | ? | (데이터 부족) | [NEW] |
| 73 | HRM 슬라이드 모바일 레이아웃 및 그래프 개선 | 2025-12-11 | ? | ? | (데이터 부족) | [NEW] |
| 72 | Enable mobile swipe navigation for slides | 2025-12-11 | ? | ? | (데이터 부족) | [NEW] |
| 71 | Add backcross direction recommendation feature | 2025-12-10 | ? | ? | (데이터 부족) | [NEW] |
| 70 | Add CLAUDE.md: PR 생성 후 링크 출력 규칙 추가 | 2025-12-10 | ? | ? | (데이터 부족) | [DOC] |
| 69 | Claude/fix pptx text display 01 xwgq s4z e zwg z cp4jdv r... | 2025-12-10 | ? | ? | (데이터 부족) | [FIX] |
| 68 | Fix text display in PPTX and PPSX files | 2025-12-10 | ? | ? | (데이터 부족) | [FIX] |
| 67 | Claude/fix genetic algorithm results 01 hj6 j3w cajx t3t ... | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 66 | Claude/fix genetic algorithm results 01 hj6 j3w cajx t3t ... | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 65 | 일괄 후대예측 결과에서 GA 목표 형질만 표시하도록 수정 | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 64 | Claude/fix genetic algorithm results 01 hj6 j3w cajx t3t ... | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 63 | 유전 알고리즘 결과와 후대 예측 연결 개선 | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 62 | PPTX 텍스트 파싱 및 메인 화면 표시 개선 | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 61 | 발표자 도구 슬라이드 미리보기 텍스트 표시 수정 | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 60 | 발표자 도구 슬라이드 표시 및 PPTX 파싱 개선 | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 59 | 발표자 도구 레이아웃 개선 및 슬라이드 내비게이터 수정 | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 58 | PPTX 파싱 전면 개선 및 발표자 도구 UI 리뉴얼 | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 57 | 발표자 도구 타이머 및 레이아웃 수정 | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 56 | 타이머가 프레젠테이션 시작부터 지속되도록 수정 | 2025-12-09 | ? | ? | (데이터 부족) | [FIX] |
| 55 | Claude/presenter tools dual monitor 01 cn pc m gc qga jf ... | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 54 | Improve presenter tools for dual monitor setup | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 53 | Improve presenter tools for dual monitor setup | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 52 | Improve presenter tools for dual monitor setup | 2025-12-09 | ? | ? | (데이터 부족) | [NEW] |
| 51 | Skywork 슬라이드 제작 요청서 추가 | 2025-12-08 | ? | ? | (데이터 부족) | [NEW] |
| 50 | 육종 시뮬레이터 슬라이드 제작 자료 추가 | 2025-12-08 | ? | ? | (데이터 부족) | [NEW] |
| 49 | Add bulk download option for analysis results | 2025-12-08 | ? | ? | (데이터 부족) | [NEW] |
| 48 | 테두리 색상 옵션 추가 및 단완/장완 둥근 사각형으로 변경 | 2025-12-05 | ? | ? | (데이터 부족) | [NEW] |
| 47 | 시각화 프리셋 단순화 및 단완/장완 테두리 수정 | 2025-12-05 | ? | ? | (데이터 부족) | [FIX] |
| 46 | Connect background selection app to index | 2025-12-05 | ? | ? | (데이터 부족) | [NEW] |
| 45 | 후대 예측 결과 전체 형질 표시 및 별도 엑셀 다운로드 추가 | 2025-12-04 | ? | ? | (데이터 부족) | [FIX] |
| 44 | 유전 알고리즘 적합도 함수 개선 및 염색체 맵 수정 | 2025-12-04 | ? | ? | (데이터 부족) | [FIX] |
| 43 | 세션 저장/복원에 표현형별 유전자 매핑(traitGeneMapping) 추가 | 2025-12-04 | ? | ? | (데이터 부족) | [REVERT] |
| 42 | 연관교배 시뮬레이션 UI 개선 및 결과 해설 추가 | 2025-12-04 | ? | ? | (데이터 부족) | [FIX] |
| 41 | Fix script tag parsing issue in showProfileDebug function | 2025-12-04 | ? | ? | (데이터 부족) | [FIX] |
| 40 | Fix rice breeding simulation result visibility | 2025-12-04 | ? | ? | (데이터 부족) | [FIX] |
| 39 | Improve gel analyzer with ladder-based band detection and... | 2025-12-04 | ? | ? | (데이터 부족) | [NEW] |
| 38 | Fix lane and band detection bugs in gel analyzer | 2025-12-04 | ? | ? | (데이터 부족) | [FIX] |
| 37 | Build gel image analysis tool | 2025-12-04 | ? | ? | (데이터 부족) | [NEW] |
| 36 | Reorganize gene ID conversion to site collection | 2025-12-04 | ? | ? | (데이터 부족) | [NEW] |
| 35 | Reorganize gene ID conversion to site collection | 2025-12-04 | ? | ? | (데이터 부족) | [NEW] |
| 34 | Claude/integrate gel analyzer 01 th2k cju3 jkd1 uf68 psxtut | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 32 | Update Todos and integrate gel analyzer | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 31 | Move eyedropper controls outside image-preview div | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 30 | Add enhanced leaf and seed image analysis features | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 29 | Simplify database links - use locus page for RAP-DB | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 28 | Fix database links: RAP-DB direct, RGAP via ID Converter API | 2025-12-03 | ? | ? | (데이터 부족) | [FIX] |
| 27 | Improve gene info and database links with clipboard copy | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 26 | Fix database search URLs for RAP-DB, Gramene, and RGAP | 2025-12-03 | ? | ? | (데이터 부족) | [FIX] |
| 25 | Improve gene info display and CK/NTC filtering | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 24 | Claude/phenotype upload feature 01 ajsz68wmo6brq24 cu md ... | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 23 | Fix database search URLs for RAP-DB, Gramene, and RGAP | 2025-12-03 | ? | ? | (데이터 부족) | [FIX] |
| 22 | Claude/phenotype upload feature 01 ajsz68wmo6brq24 cu md ... | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 21 | Claude/phenotype upload feature 01 ajsz68wmo6brq24 cu md ... | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 20 | Claude/phenotype upload feature 01 ajsz68wmo6brq24 cu md ... | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 19 | Claude/phenotype upload feature 01 ajsz68wmo6brq24 cu md ... | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 18 | Add new online-enabled tools and reorganize navigation | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 17 | Add file deletion functionality to all three web tools | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 16 | Claude/phenotype upload feature 01 ajsz68wmo6brq24 cu md ... | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 15 | Add direct genotype upload and reorganize data upload cards | 2025-12-03 | ? | ? | (데이터 부족) | [NEW] |
| 14 | Add enhanced chart styling options with color palette and... | 2025-12-03 | ? | ? | (데이터 부족) | [STYLE] |
| 13 | Add phenotype upload feature and improve UI documentation | 2025-12-03 | ? | ? | (데이터 부족) | [DOC] |
| 12 | Fix KeyError by only considering successfully trained models | 2025-12-02 | ? | ? | (데이터 부족) | [FIX] |
| 11 | Add KASP-Simulator data integration feature | 2025-12-02 | ? | ? | (데이터 부족) | [NEW] |
| 10 | Fix KeyError &#39;RandomForest&#39; when model training f... | 2025-12-02 | ? | ? | (데이터 부족) | [FIX] |
| 9 | Add KASP analyzer link to index.html | 2025-12-02 | ? | ? | (데이터 부족) | [NEW] |
| 7 | Fix GridSearch by disabling all parallel processing in Py... | 2025-12-02 | ? | ? | (데이터 부족) | [FIX] |
| 6 | Add iframe-based app loading within sidebar layout | 2025-12-02 | ? | ? | (데이터 부족) | [NEW] |
| 5 | Claude/link breeding pages 015 ww vjq uhb svd b lfzmcc4 pw | 2025-12-02 | ? | ? | (데이터 부족) | [NEW] |
| 4 | Fix GridSearch error and add drag-and-drop file upload | 2025-12-02 | ? | ? | (데이터 부족) | [FIX] |
| 3 | Improve fitness function with ML-based evaluation | 2025-12-02 | ? | ? | (데이터 부족) | [NEW] |
| 2 | Fix display label horizontal spacing issue | 2025-12-01 | ? | ? | (데이터 부족) | [FIX] |
| 1 | Fix phenotyping visualization issues and add new features | 2025-12-01 | ? | ? | (데이터 부족) | [FIX] |

---

## 분류별 카운트

- **[NEW]**: 182건
- **[FIX]**: 80건
- **[DOC]**: 5건
- **[REVERT]**: 3건
- **[REFACTOR]**: 3건
- **[STYLE]**: 1건

## 브랜치 슬러그 클러스터 Top 15 (시행착오 클러스터의 1차 지표)

같은 브랜치명에서 여러 PR이 머지된 경우 = 한 작업을 여러 번 시도/수정한 흔적.

| 브랜치 슬러그 | PR 횟수 |
|--------------|---------|
| `restore-desktop-features` | 34 |
| `lab-booking-enhancements` | 31 |
| `fix-build-version-issue` | 19 |
| `floating-sticky-notes-app` | 17 |
| `phenotype-upload-feature-01Ajsz68wmo6brq24CUMdD9P` | 17 |
| `auto-convert-sequencing-data` | 12 |
| `presenter-tools-dual-monitor-01CnPcMGcQGAJfTmjEcYrrqH` | 11 |
| `lab-booking-html-edit` | 10 |
| `fix-chromosome-visualization` | 7 |
| `lab-booking-page-address` | 7 |
| `image-compression-webapp` | 7 |
| `experiment-timeline-app` | 6 |
| `analyze-rice-breeding-app` | 5 |
| `fix-genetic-algorithm-results-01Hj6J3wCajxT3tJeNfkMqgz` | 5 |
| `fix-breeding-results-display-01BTNf6yDu5ufWdvCxfdMism` | 5 |

## 자주 수정된 파일 Top 10 (머지커밋 데이터 한정)

| 파일 | PR 횟수 | PR 번호 |
|------|---------|---------|
| `background_selection_v3.HTML` | 22 | #276, #275, #274, #273, #272, #271, #270, #269 외 14개 |
| `sticky_notes_app/stickynote.html` | 7 | #247, #246, #237, #236, #235, #234, #233 |
| `rice_breeding_v4_16_prediction.html` | 6 | #245, #242, #241, #240, #239, #238 |
| `CLAUDE.md` | 3 | #280, #279, #278 |
| `sticky_notes_app/sw.js` | 3 | #277, #248, #234 |
| `bdss_core/__init__.py` | 3 | #252, #251, #243 |
| `rice_breeding_v5_0.html` | 2 | #281, #278 |
| `pdf-password-remover/index.html` | 2 | #254, #253 |
| `demo_data_miryang.js` | 1 | #281 |
| `gene_metadata_layer.js` | 1 | #278 |

---

## 출처

- PR 메타: GitHub MCP `mcp__github__list_pull_requests` (state=closed, perPage=100, page=1~3)
- 파일 정보: 로컬 `git log --all --merges -m --first-parent --numstat`
- gh CLI 미설치로 인해 GitHub MCP로 대체 수집
- 보조 레포 `olivettirda/label`은 MCP repo scope 제한으로 접근 불가 → 별도 인벤토리 미작성

_생성일: 2026-04-27 / 총 274건 / 분류 매칭률 100%_