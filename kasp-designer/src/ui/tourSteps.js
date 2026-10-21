/**
 * tourSteps.js — 튜토리얼 단계 내용 (서면 매뉴얼에도 같은 내용이 쓰인다)
 * ctx: { ensureExample, ensureAnalysis, ensureDesigned, openDetails }
 */
export function buildTourSteps(ctx) {
  return [
    {
      group: '시작', title: 'KASP 디자이너 둘러보기',
      text: '약 2분짜리 안내입니다. 지금 바쁘시면 "건너뛰기"나 Esc 로 바로 닫아도 되고, 이 안내는 다시 자동으로 뜨지 않습니다. 왼쪽 메뉴 순서대로 서열 입력 → 설계 조건 → Tail → 결과 → 내보내기 로 진행하며, "다음" 버튼이나 → 키로 넘기고 ← 키로 돌아갑니다. 언제든 상단의 ? 버튼에서 다시 재생하거나 서면 매뉴얼로 읽을 수 있습니다.',
    },
    {
      group: '서열 입력', pane: 'input', target: '#cropCard', title: '작물 모드',
      text: '벼(IRGSP-1.0) · 밀(IWGSC RefSeq v2.1) · 일반 중에서 고릅니다. 밀은 육배체라 A·B·D 상동유전체 서열을 함께 넣으면 프라이머가 목표 유전체에만 붙는지(특이 / 반특이 / 비특이) 검사해 Common 후보 순위에 반영합니다. 좌표 표기와 rsID 조회 종도 작물에 맞게 바뀝니다.',
    },
    {
      group: '서열 입력', pane: 'input', target: '#seqInput', title: '서열을 붙여넣습니다',
      text: 'FASTA 헤더(>이름) 뒤에 서열을 넣고, 변이는 [A/G] 처럼 대괄호로 씁니다. InDel 은 [AG/], IUPAC 은 [R], 프라이머를 놓지 않을 구간은 /…/ 로 감쌉니다. 변이 양쪽에 flank 100–200 nt 가 있어야 Common 프라이머 자리를 찾을 수 있습니다. 헤더에 Chr01:1234567 을 적으면 유전체 좌표로 변환됩니다.',
      before: () => ctx.ensureExample(),
    },
    {
      group: '서열 입력', pane: 'input', target: '#seqSummary', title: '실시간 요약',
      text: '붙여넣는 즉시 서열 수, 길이, GC%, 각 마커의 대립유전자를 보여 줍니다. 형식 오류나 주의할 점은 바로 아래에 표시됩니다.',
    },
    {
      group: '서열 입력', pane: 'input', target: '#exampleMenu', title: '예제 불러오기',
      text: 'SNP · IUPAC · InDel · MNV · 3대립 · 제외구역 예제 5종을 넣어 볼 수 있습니다. 여러 레코드를 한 번에 넣으면 일괄 설계되고 엑셀에도 함께 저장됩니다.',
    },
    {
      group: '서열 입력', pane: 'input', target: '#rsidCard', title: 'rsID 로 서열 가져오기 (온라인)',
      text: '변이 ID 를 알면 Ensembl 에서 flank 포함 서열을 받아 입력창에 추가합니다. 벼는 oryza_sativa 입니다. 오프라인이면 안내만 하고 넘어갑니다.',
    },
    {
      group: '프라이머 분석', pane: 'analyze', target: '#guideCard', title: '처음 사용 3단계',
      text: '처음이라면 이 세 단계만 기억하면 됩니다. 서열 입력 → (기존 프라이머가 있으면 분석으로 조건 추정) → 설계와 내보내기.',
    },
    {
      group: '프라이머 분석', pane: 'analyze', target: '#primerInput', title: '기존 프라이머 분석',
      text: '이미 쓰던 프라이머를 이름·서열로 붙여넣고 "분석"을 누르면 tail 을 자동으로 떼어 본체 Tm(두 프리셋)·GC·LC 를 계산하고, 템플릿이 있으면 위치·역할(ASP/Common)·3′ 말단·amplicon 까지 판정합니다.',
      before: () => ctx.ensureAnalysis(),
    },
    {
      group: '프라이머 분석', pane: 'analyze', target: '#analyzeSummary', title: '추정 조건 적용',
      text: '분석값으로 "비슷하게 설계하려면" 쓸 조건(프리셋, Tm 범위, 길이, GC, amplicon, tail)을 추정해 현재 조건과 나란히 보여 줍니다. "이 조건을 설계 조건에 적용" 또는 "적용하고 바로 설계"를 누르세요.',
    },
    {
      group: '설계 조건', pane: 'params', target: '#basicParamsCard', title: 'Tm 범위와 길이',
      text: '기본값은 벼 분자육종 표준입니다: Tm 57–62 °C, ASP/Common 18–25 nt, GC 40–60 %, amplicon 50–150 bp. 슬라이더나 숫자로 바꾸고 "기본값 복원"으로 되돌립니다. Tm 은 항상 tail 을 뺀 본체로 계산합니다.',
    },
    {
      group: '설계 조건', pane: 'params', target: '#presetCard', title: 'Tm 계산 조건(프리셋)',
      text: '바이오니어(Na⁺ 50 mM, 올리고 250 nM, 15 nt 미만 Wallace rule)가 기본입니다. primerdigital(55 mM / Mg²⁺ 1 mM / 200 nM)은 사이트 값과 비교용으로, 같은 서열이 약 5 °C 높게 나옵니다. 사용자 정의도 됩니다.',
    },
    {
      group: '설계 조건', pane: 'params', target: '#advancedCard', title: '고급 설정',
      text: 'SNP offset, Common 3′-end 패턴, LC 하한, 다이머 임계, 다이머 검사에 tail 포함 여부, 반복·저복잡도 마스킹, bisulfite 를 조정합니다. 보통은 그대로 두어도 됩니다.',
      before: () => ctx.openDetails('#advancedCard'),
    },
    {
      group: 'Tail', pane: 'tails', target: '#modeSeg', title: '판독 방식',
      text: '형광(KASP)은 ASP 5′ 에 FAM/HEX tail 을 붙이고, 겔(Allele sizing)은 tail 대신 filler 로 대립유전자별 산물 길이를 사다리로 만듭니다.',
    },
    {
      group: 'Tail', pane: 'tails', target: '#tailRows', title: 'Tail 서열',
      text: 'LGC 표준 FAM/HEX 가 기본이고 편집할 수 있습니다. 1번 대립유전자에 FAM, 2번에 HEX 가 붙으며, 대립유전자가 tail 수보다 많으면 tail 없이 설계하고 경고합니다.',
    },
    {
      group: '설계 실행', target: '#designBtn', title: '프라이머 설계',
      text: '조건이 준비되면 이 버튼(또는 서열 입력창에서 Ctrl+Enter)을 누릅니다. 결과는 바로 결과 탭에 나타납니다. 조건을 바꾼 뒤에는 다시 눌러 주세요.',
      before: () => ctx.ensureDesigned(),
    },
    {
      group: '결과', pane: 'results', target: '#markerTabs', title: '마커 선택',
      text: '여러 레코드를 넣었다면 마커별로 결과를 전환합니다. 오류가 난 레코드는 빨간 테두리로 표시됩니다.',
    },
    {
      group: '결과', pane: 'results', target: '#dirSeg', title: 'Forward / Reverse 세트',
      text: '같은 변이를 양쪽 가닥에서 설계한 두 세트입니다. 경고가 적고 amplicon 이 권장 범위에 드는 쪽을 고르면 됩니다.',
    },
    {
      group: '결과', pane: 'results', target: '#warnBox', title: '경고 패널',
      text: 'GC 범위 밖, ASP–Common Tm 차 > 3 °C, 다이머, tail 부족, amplicon 범위 밖 등 확인할 점을 모아 보여 줍니다. 경고가 있어도 설계 자체는 유효합니다.',
    },
    {
      group: '결과', pane: 'results', target: '#setCard', title: '세트 카드',
      text: 'ASP 2개와 Common 1개가 한 세트입니다. 회색은 tail, 굵은 색 글자는 변이 염기이고, Tm 은 tail 을 뺀 값입니다. 점 색은 Tm 범위 안(초록)·경계(주황)·밖(빨강). 오른쪽 위 복사·엑셀 버튼으로 바로 내보냅니다.',
    },
    {
      group: '결과', pane: 'results', target: '#commonCard', title: 'Common 후보',
      text: '점수순(권장 amplicon → Tm 차 → GC → LC)으로 정렬된 후보입니다. 행을 누르면 세트의 Common 이 바뀌고 amplicon 과 Tm 차가 다시 계산됩니다.',
    },
    {
      group: '결과', pane: 'results', target: '#viewerCard', title: '서열 뷰어',
      text: '템플릿 위에 ASP(청록)·Common(검정) 위치 막대, 변이 위치, 마스킹된 구간(반복·저복잡도·주변 변이)과 제외구역을 그립니다.',
      before: () => ctx.openDetails('#viewerCard'),
    },
    {
      group: '결과', pane: 'results', target: '#reportCard', title: '전체 후보 (Report)',
      text: '모든 후보를 ID · Sequence · Length · Tm · GC · LC 표로 보고, 몇 개가 어떤 이유로 탈락했는지 통계를 확인합니다.',
      before: () => ctx.openDetails('#reportCard'),
    },
    {
      group: '내보내기', pane: 'export', target: '#exportRangeCard', title: '내보낼 범위',
      text: '현재 마커만 또는 전체 마커, 세트 방향(현재 선택 / Forward / Reverse / 둘 다), 합성 규모를 고릅니다.',
    },
    {
      group: '내보내기', pane: 'export', target: '#xlsxBtn', title: '엑셀 다운로드',
      text: '주문용 시트(Primer Name, Sequence, Direction, Length, Purpose, Scale)와 설계근거 시트(Chr:bp 위치, Tm 조건, 변환 전략, 비고)로 저장됩니다. TSV 복사 버튼도 있습니다.',
    },
    {
      group: '상단바', target: '#presetSeg', title: 'Tm 프리셋 토글',
      text: '어느 화면에서나 바이오니어 / primerdigital 을 바꿀 수 있습니다. 바꾼 뒤에는 다시 설계하세요.',
    },
    {
      group: '상단바', target: '#themeBtn', title: '테마',
      text: '라이트 / 다크를 전환합니다. 기본은 시스템 설정을 따르며 선택은 기억됩니다.',
    },
    {
      group: '끝', title: '준비 끝',
      text: '언제든 상단 ? 버튼에서 튜토리얼을 다시 재생하거나 서면 매뉴얼을 볼 수 있습니다. 서면 매뉴얼의 각 항목에서 그 단계만 재생할 수도 있습니다.',
    },
  ];
}
