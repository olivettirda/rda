# prompt_logic_4.md — 시행착오 사례: PR #272

## PR #272 — 마커 라벨 위치 매핑 개선: 물리적 위치 기반 정확한 배치

대상 파일: `background_selection_v3.HTML` · 함수 `renderMarkerLabels(chrResult, armStart, armEnd, armLength, containerEl)` · diff +102 / −78 (단일 함수 재작성)

### 변경 전 (요약)

- `renderMarkerLabels()` 는 마커들을 **클러스터로 그룹핑**: `clusterThreshold = armLength * 0.04` 안에 들어오는 인접 마커들을 한 묶음으로 처리.
- 각 클러스터의 **평균 위치**(`clusterCenter`) 한 점에서만 X좌표를 계산하고 거기서 가지(branch)들이 뻗어 나가 각 마커 라벨로 연결.
- 가지 길이는 `10 + idx * 4`px 로 클러스터 내 순서에 따라 길어짐. 클러스터가 좌·우 절반 어느 쪽인지(`isRightHalf`) 로 가지 방향 결정.
- 겹침 방지는 라벨 간 거리(`Math.abs(prev.left - centerPx) < 60`)만 보고 Y 를 14px 씩 밀어내는 단순 휴리스틱.
- 결과적으로 **개별 마커의 실제 물리적 위치는 화면에 표시되지 않음** — 라벨이 가리키는 점이 클러스터 평균 한 곳뿐.

### PR 본문의 프롬프트

> - 클러스터 기반 → 개별 마커 물리적 위치 기반 X좌표 계산으로 변경
> - 염색체 바 위 마커 위치에 수직 눈금선(tick) 추가
> - 슬롯 기반 겹침 방지 알고리즘으로 라벨 분산 개선
> - 물리적 위치 표시 시 name (position) 형식으로 출력
> - 디버깅용 콘솔 로그 추가

### 변경 후 (요약)

- 클러스터링 로직 전체 제거. 각 마커에 대해 직접 `xPx = ((m.position - armStart) / armLength) * containerWidth` 계산 (`markerPositions.map(...)`).
- 염색체 바 위에 마커마다 **수직 눈금선(tick)** 1px 추가 (`opacity:0.35`) — 클러스터 평균이 아니라 실제 위치를 시각적으로 표시.
- 라벨 텍스트 포맷이 `name posText` 에서 `name (position)` 로 변경(괄호 표기).
- **슬롯 기반 충돌 회피**: `usedSlots = [{y, leftPx, rightPx}]` 배열에 점유 영역 저장, 새 라벨은 60회까지 Y 슬롯(`LINE_HEIGHT=13`) 을 내려가며 가로(`approxLabelWidth = labelText.length * 5.5`) 겹침을 검사 → 비는 슬롯에 배치.
- 좌/우 방향은 `isRightHalf = xPx > containerWidth * 0.6` 단일 기준. 수직선 → 수평 가지선(6px) → 텍스트 순서로 그림.
- 디버그 `console.log('마커 라벨 렌더링:', { arm, chr, armStart, armEnd, armLength, containerWidth, markerCount, firstPos, lastPos, firstXPx, lastXPx })` 추가 (CLAUDE.md 디버깅 규칙 준수).

### 변경 사유

같은 브랜치(`claude/fix-chromosome-visualization-zBN4y`)에서 #269–#275 까지 7회 반복 수정된 사실 자체가 시행착오의 흔적. **클러스터 평균 한 점**으로 라벨을 모아 그리던 기존 방식은 마커 밀도가 낮은 영역에서는 위치가 그럴듯해 보였지만, 실제 마커가 염색체 바 어디에 박혀 있는지 사용자가 시각적으로 확인할 수 없었음. PR 본문이 명시한 "**개별 마커 물리적 위치 기반 X좌표 계산으로 변경**" 은 이 근본 문제를 잡기 위한 알고리즘 교체이며, 동시에 (1) 눈금선으로 위치 검증, (2) 슬롯 기반 겹침 방지, (3) `name (position)` 표기로 위치값 명시 — 세 가지 보조 장치로 검증·가독성을 함께 개선. 디버그 로그(`firstXPx/lastXPx`) 는 다음 후속 PR(#273–#275)에서 좌표 검증을 빠르게 하기 위한 사전 작업.
