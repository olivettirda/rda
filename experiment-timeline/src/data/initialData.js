// 영진 돌연변이 논문 실험 일정 초기 데이터
export const INITIAL_PROJECT = {
  projectId: "youngjin-mutation-001",
  projectName: "영진 돌연변이 논문",
  description: "완전미율 관련 QTL 분석 및 NIL 개발 (동계온실 세대진전 반영)",
  createdAt: "2025-01-18T00:00:00Z",
  updatedAt: "2025-01-18T00:00:00Z",

  periods: [
    {
      periodId: "p-25w",
      name: "25년 동계",
      shortName: "25동",
      startDate: "2025-10-01",
      endDate: "2026-04-30",
      order: 1,
      items: [
        {
          itemId: "i-001",
          title: "F1 작성 (정교배)",
          description: "영진 × 정상",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F1(정)"],
          memo: "",
          tags: ["교배"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-002",
          title: "F1 작성 (역교배)",
          description: "정상 × 영진",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F1(역)"],
          memo: "",
          tags: ["교배"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-25s",
      name: "25년 하계",
      shortName: "25하",
      startDate: "2025-05-01",
      endDate: "2025-09-30",
      order: 2,
      items: [
        {
          itemId: "i-003",
          title: "F2 종자 확보",
          description: "정역교배 F1 각각 자가수정",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F2(정)", "F2(역)"],
          memo: "",
          tags: ["종자확보"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-004",
          title: "영진 여교배",
          description: "영진 × F1 → BC1F1 종자",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["BC1F1"],
          memo: "",
          tags: ["교배"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-005",
          title: "세포질 유전 검정",
          description: "정역교배 F1 표현형 비교",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["유전분석"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-26s",
      name: "26년 하계",
      shortName: "26하",
      startDate: "2026-05-01",
      endDate: "2026-09-30",
      order: 3,
      items: [
        {
          itemId: "i-006",
          title: "F2 전개",
          description: "200개체 이상",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F2"],
          memo: "",
          tags: ["포장"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-007",
          title: "BC1F1 전개",
          description: "",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["BC1F1"],
          memo: "",
          tags: ["포장"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-008",
          title: "분리비 검정",
          description: "F2 χ² test, BC1F1 χ² test",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["유전분석"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-009",
          title: "개체 선발 샘플링",
          description: "극단 표현형 각 30개체",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["샘플링"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-010",
          title: "배유 발달 관찰",
          description: "출수 후 5, 10, 15, 20, 25일 샘플링",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["샘플링", "현미경"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-26a",
      name: "26년 추계",
      shortName: "26추",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
      order: 4,
      items: [
        {
          itemId: "i-011",
          title: "품위 검정 (기본)",
          description: "완전미율, 동할미율, 분상질립률, 천립중",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["품위검정"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-012",
          title: "품위 검정 (상세)",
          description: "심복백 정도, 투명도, 현미천립중",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["품위검정"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-013",
          title: "그루핑",
          description: "QTL-seq용 bulk 구성",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["QTL"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-014",
          title: "배유 횡단면 관찰",
          description: "정상 vs 영진 vs F2 극단개체",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["현미경"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-26w1",
      name: "26년 동계 1차",
      shortName: "26동1",
      startDate: "2026-10-01",
      endDate: "2027-01-31",
      order: 5,
      items: [
        {
          itemId: "i-015",
          title: "QTL-seq",
          description: "High bulk vs Low bulk",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["QTL", "시퀀싱"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-016",
          title: "마커 개발",
          description: "QTL 구간 내 KASP 마커",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["마커"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-017",
          title: "F3 전개 (온실)",
          description: "마커 선발, 표현형 불가",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F3"],
          memo: "",
          tags: ["온실", "마커선발"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-018",
          title: "BC1F2 전개 (온실)",
          description: "마커 선발",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["BC1F2"],
          memo: "",
          tags: ["온실", "마커선발"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-26w2",
      name: "26년 동계 2차",
      shortName: "26동2",
      startDate: "2027-01-01",
      endDate: "2027-04-30",
      order: 6,
      items: [
        {
          itemId: "i-019",
          title: "F4 전개 (온실)",
          description: "마커 선발, homo 고정 확인",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F4"],
          memo: "",
          tags: ["온실", "마커선발"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-020",
          title: "BC1F3 전개 (온실)",
          description: "마커 선발",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["BC1F3"],
          memo: "",
          tags: ["온실", "마커선발"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-021",
          title: "전분 특성 분석",
          description: "아밀로스 함량, RVA",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["전분분석"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-27sp",
      name: "27년 춘계",
      shortName: "27춘",
      startDate: "2027-03-01",
      endDate: "2027-05-31",
      order: 7,
      items: [
        {
          itemId: "i-022",
          title: "QTL 학술발표",
          description: "육종학회/작물학회",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["학회"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-023",
          title: "후보유전자 동정",
          description: "QTL 구간 내 기존 유전자 비교",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["유전자분석"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-024",
          title: "후보유전자 시퀀싱",
          description: "영진 vs 정상, EMS 변이 동정 (G→A, C→T)",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["시퀀싱"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-27s",
      name: "27년 하계",
      shortName: "27하",
      startDate: "2027-05-01",
      endDate: "2027-09-30",
      order: 8,
      items: [
        {
          itemId: "i-025",
          title: "F5 전개 (포장)",
          description: "고정개체 표현형 확인",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F5"],
          memo: "",
          tags: ["포장"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-026",
          title: "BC1F4 전개 (포장)",
          description: "표현형 확인",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["BC1F4"],
          memo: "",
          tags: ["포장"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-027",
          title: "Target capture",
          description: "백그라운드 선발, NIL 선발",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["NIL 후보"],
          memo: "",
          tags: ["시퀀싱", "선발"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-028",
          title: "등숙 dynamics",
          description: "건물중 증가 곡선, 등숙률/등숙기간",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["표현형"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-029",
          title: "RNA 샘플링",
          description: "출수 후 7, 14, 21일 (최소 1시점)",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["샘플링", "RNA"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-030",
          title: "RNA 시계열 샘플링",
          description: "3시점 전부",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["샘플링", "RNA"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-27a",
      name: "27년 추계",
      shortName: "27추",
      startDate: "2027-10-01",
      endDate: "2027-10-31",
      order: 9,
      items: [
        {
          itemId: "i-031",
          title: "고정개체 선발",
          description: "표현형 + 마커",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["F5 선발계통"],
          memo: "",
          tags: ["선발"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-032",
          title: "NIL 후보 선발",
          description: "백그라운드 회복률 기준",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["선발"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-033",
          title: "배유 SEM 관찰",
          description: "전분립 충전 상태",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["현미경"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-27w1",
      name: "27년 동계 1차",
      shortName: "27동1",
      startDate: "2027-10-01",
      endDate: "2028-01-31",
      order: 10,
      items: [
        {
          itemId: "i-034",
          title: "QTL validation",
          description: "BC1F2 QTL 분석",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["QTL"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-035",
          title: "후보유전자 발현분석",
          description: "qRT-PCR",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["발현분석"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-036",
          title: "자연변이 탐색",
          description: "3K RG / KRICE_CORE haplotype 분석",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["자연변이"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-037",
          title: "NIL 종자증식 (온실)",
          description: "",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["온실", "증식"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-27w2",
      name: "27년 동계 2차",
      shortName: "27동2",
      startDate: "2028-01-01",
      endDate: "2028-04-30",
      order: 11,
      items: [
        {
          itemId: "i-038",
          title: "자연변이 마커 개발",
          description: "유리한 haplotype 선발용 KASP",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["마커", "자연변이"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-039",
          title: "RNA-seq 분석",
          description: "DEG, GO/KEGG enrichment",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["RNA", "발현분석"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-040",
          title: "NIL 종자증식 2차",
          description: "생검용 종자량 확보",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["온실", "증식"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-28s",
      name: "28년 하계",
      shortName: "28하",
      startDate: "2028-05-01",
      endDate: "2028-09-30",
      order: 12,
      items: [
        {
          itemId: "i-041",
          title: "생산력검정시험",
          description: "",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["생검"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-042",
          title: "자연변이 보유 계통 수집",
          description: "핵심집단/유전자원에서",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["자연변이"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-043",
          title: "고온등숙 처리",
          description: "완전미율 × 온도 상호작용",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["표현형"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-044",
          title: "다지역 평가 1차",
          description: "NIL 2지역 재배",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["다환경"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-28a",
      name: "28년 추계",
      shortName: "28추",
      startDate: "2028-10-01",
      endDate: "2028-10-31",
      order: 13,
      items: [
        {
          itemId: "i-045",
          title: "NIL 신규 계통 등록",
          description: "",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["등록"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-046",
          title: "자연변이 계통 표현형 검정",
          description: "완전미율 비교",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["자연변이", "표현형"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-28w",
      name: "28년 동계",
      shortName: "28동",
      startDate: "2028-10-01",
      endDate: "2029-04-30",
      order: 14,
      items: [
        {
          itemId: "i-047",
          title: "논문 초안 작성",
          description: "",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["논문"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-048",
          title: "다지역 평가 2차 준비",
          description: "",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["다환경"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    },
    {
      periodId: "p-29s",
      name: "29년 하계",
      shortName: "29하",
      startDate: "2029-05-01",
      endDate: "2029-09-30",
      order: 15,
      items: [
        {
          itemId: "i-049",
          title: "다지역 평가 2차",
          description: "2년차 반복",
          priority: "optional",
          completed: false,
          completedAt: null,
          populations: ["NIL"],
          memo: "",
          tags: ["다환경"],
          createdAt: "2025-01-18T00:00:00Z"
        },
        {
          itemId: "i-050",
          title: "논문 투고",
          description: "",
          priority: "required",
          completed: false,
          completedAt: null,
          populations: [],
          memo: "",
          tags: ["논문"],
          createdAt: "2025-01-18T00:00:00Z"
        }
      ]
    }
  ],

  populations: [
    { populationId: "pop-001", name: "F1(정)", parentPopulation: null, currentStatus: "완료대기", activePeriods: ["25동"], notes: "영진♀ × 정상♂" },
    { populationId: "pop-002", name: "F1(역)", parentPopulation: null, currentStatus: "완료대기", activePeriods: ["25동"], notes: "정상♀ × 영진♂" },
    { populationId: "pop-003", name: "F2(정)", parentPopulation: "F1(정)", currentStatus: "예정", activePeriods: ["25하", "26하", "26추"], notes: "" },
    { populationId: "pop-004", name: "F2(역)", parentPopulation: "F1(역)", currentStatus: "예정", activePeriods: ["25하", "26하", "26추"], notes: "" },
    { populationId: "pop-005", name: "F3", parentPopulation: "F2(정)", currentStatus: "예정", activePeriods: ["26동1"], notes: "온실 마커선발" },
    { populationId: "pop-006", name: "F4", parentPopulation: "F3", currentStatus: "예정", activePeriods: ["26동2"], notes: "온실 마커선발" },
    { populationId: "pop-007", name: "F5", parentPopulation: "F4", currentStatus: "예정", activePeriods: ["27하", "27추"], notes: "포장 표현형 확인" },
    { populationId: "pop-008", name: "F5 선발계통", parentPopulation: "F5", currentStatus: "예정", activePeriods: ["27추"], notes: "" },
    { populationId: "pop-009", name: "BC1F1", parentPopulation: null, currentStatus: "예정", activePeriods: ["25하", "26하"], notes: "영진 × F1" },
    { populationId: "pop-010", name: "BC1F2", parentPopulation: "BC1F1", currentStatus: "예정", activePeriods: ["26동1", "27동1"], notes: "온실, QTL validation" },
    { populationId: "pop-011", name: "BC1F3", parentPopulation: "BC1F2", currentStatus: "예정", activePeriods: ["26동2"], notes: "온실 마커선발" },
    { populationId: "pop-012", name: "BC1F4", parentPopulation: "BC1F3", currentStatus: "예정", activePeriods: ["27하"], notes: "포장 표현형 확인" },
    { populationId: "pop-013", name: "NIL 후보", parentPopulation: "BC1F4", currentStatus: "예정", activePeriods: ["27하"], notes: "Target capture" },
    { populationId: "pop-014", name: "NIL", parentPopulation: "NIL 후보", currentStatus: "예정", activePeriods: ["27추", "27동1", "27동2", "28하", "28추", "29하"], notes: "최종 목표" }
  ],

  settings: {
    showCompleted: true,
    showOptional: true
  }
};
