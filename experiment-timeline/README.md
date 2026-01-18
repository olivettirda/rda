# 실험 일정 관리 웹앱 (Experiment Timeline Manager)

육종 연구 실험 일정을 시각적 타임라인으로 관리하는 웹 애플리케이션

## 주요 기능

- ✅ **세로 타임라인 뷰** - 시기별 실험 항목을 시간 순으로 표시
- ✅ **체크박스** - 실험 완료 여부 추적
- ✅ **메모 기능** - 각 항목에 메모 추가/수정
- ✅ **집단 관리** - 관리 중인 집단 현황 한눈에 파악
- ✅ **LocalStorage 저장** - 브라우저에 자동 저장
- ✅ **JSON Export/Import** - 데이터 백업 및 복원
- ✅ **필터링** - 완료/미완료, 필수/선택 항목 필터
- ✅ **진행률 표시** - 전체 및 시기별 진행률 시각화

## 기술 스택

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (DMRT 커스텀 컬러)
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Storage**: LocalStorage + JSON file export/import
- **No Backend Required**: 완전한 클라이언트 사이드 애플리케이션

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (http://localhost:3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드된 파일 미리보기
npm run preview
```

## 프로젝트 구조

```
experiment-timeline/
├── src/
│   ├── components/
│   │   ├── Header.jsx                 # 상단 헤더 (진행률, Export/Import)
│   │   ├── Timeline.jsx               # 메인 타임라인 컨테이너
│   │   ├── TimelinePeriod.jsx         # 시기별 그룹
│   │   ├── TimelineItem.jsx           # 개별 실험 항목
│   │   └── PopulationTracker.jsx      # 집단 현황 사이드바
│   ├── hooks/
│   │   └── useExperiments.js          # 실험 데이터 관리 훅
│   ├── utils/
│   │   ├── storage.js                 # LocalStorage 유틸리티
│   │   └── helpers.js                 # 헬퍼 함수
│   ├── data/
│   │   └── initialData.js             # 초기 데이터
│   ├── App.jsx                        # 메인 앱 컴포넌트
│   ├── main.jsx                       # 엔트리 포인트
│   └── index.css                      # 글로벌 스타일
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 데이터 구조

### 프로젝트 구조
```javascript
{
  projectId: "string",
  projectName: "string",
  description: "string",
  periods: [...],        // 시기 배열
  populations: [...],    // 집단 배열
  settings: {
    showCompleted: boolean,
    showOptional: boolean
  }
}
```

### 시기 (Period)
```javascript
{
  periodId: "string",
  name: "25년 동계",
  shortName: "25동",
  startDate: "2025-10-01",
  endDate: "2026-04-30",
  order: 1,
  items: [...]           // 실험 항목 배열
}
```

### 실험 항목 (Item)
```javascript
{
  itemId: "string",
  title: "F1 작성 (정교배)",
  description: "영진 × 정상",
  priority: "required",  // "required" | "optional"
  completed: false,
  completedAt: null,
  populations: ["F1(정)"],
  memo: "",
  tags: ["교배"],
  createdAt: "2025-01-18T00:00:00Z"
}
```

### 집단 (Population)
```javascript
{
  populationId: "string",
  name: "F3",
  parentPopulation: "F2(정)",
  currentStatus: "온실",
  activePeriods: ["26동1"],
  notes: "온실 마커선발"
}
```

## 사용 방법

### 1. 실험 항목 체크
- 완료된 항목의 체크박스를 클릭하여 완료 표시
- 완료 시각이 자동으로 기록됨

### 2. 메모 추가
- 각 항목 우측의 메모 아이콘(✏️) 클릭
- 메모 입력 후 저장 버튼 클릭

### 3. 새 항목 추가
- 각 시기 헤더의 "추가" 버튼 클릭
- 제목과 설명 입력 후 추가

### 4. 데이터 관리
- **Export**: 헤더의 Export 버튼으로 JSON 파일 다운로드
- **Import**: Import 버튼으로 JSON 파일 업로드
- **Reset**: Reset 버튼으로 초기 데이터로 재설정

### 5. 필터링
- 사이드바에서 완료 항목 표시/숨김 설정
- 선택 항목 표시/숨김 설정
- 집단별 검색 및 필터

## DMRT 디자인 시스템

이 프로젝트는 DMRT 스타일 가이드를 따릅니다:

- **Primary Dark**: `#0c3026` - 헤더, 필수 항목 강조
- **Primary Main**: `#017f97` - 주요 액션, 링크
- **Accent Colors**: `#00a1b8`, `#54b7c6` - 활성 상태, 선택 항목
- **Font**: KoPub Dotum
- **Spacing**: 8px 기반 시스템
- **Touch Target**: 최소 44px (접근성 준수)

## 브라우저 지원

- Chrome/Edge (최신 버전)
- Firefox (최신 버전)
- Safari (최신 버전)

## 라이선스

MIT License

## 개발자

RDA (농촌진흥청) - 육종 연구팀
