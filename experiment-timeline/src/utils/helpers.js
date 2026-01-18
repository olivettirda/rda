// 헬퍼 함수 모음

/**
 * UUID 생성 (간단한 버전)
 * @returns {string} UUID
 */
export const generateId = () => {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 * @param {Date|string} date - 포맷할 날짜
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDate = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * 날짜를 한국어 형식으로 포맷 (YYYY년 MM월 DD일)
 * @param {Date|string} date - 포맷할 날짜
 * @returns {string} 포맷된 날짜 문자열
 */
export const formatDateKorean = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/**
 * 날짜 범위를 한국어로 포맷
 * @param {string} startDate - 시작 날짜
 * @param {string} endDate - 종료 날짜
 * @returns {string} 포맷된 날짜 범위
 */
export const formatDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';

  return `${start.getMonth() + 1}월 ~ ${end.getMonth() + 1}월`;
};

/**
 * 진행률 계산
 * @param {Array} items - 아이템 배열
 * @returns {number} 진행률 (0-100)
 */
export const calculateProgress = (items) => {
  if (!items || items.length === 0) return 0;

  const completedCount = items.filter(item => item.completed).length;
  return Math.round((completedCount / items.length) * 100);
};

/**
 * 필수/선택 항목별 진행률 계산
 * @param {Array} items - 아이템 배열
 * @returns {Object} {required: number, optional: number, total: number}
 */
export const calculateProgressByPriority = (items) => {
  if (!items || items.length === 0) {
    return { required: 0, optional: 0, total: 0 };
  }

  const requiredItems = items.filter(item => item.priority === 'required');
  const optionalItems = items.filter(item => item.priority === 'optional');

  return {
    required: calculateProgress(requiredItems),
    optional: calculateProgress(optionalItems),
    total: calculateProgress(items)
  };
};

/**
 * 태그 추출 (중복 제거)
 * @param {Array} items - 아이템 배열
 * @returns {Array} 고유 태그 배열
 */
export const extractUniqueTags = (items) => {
  const allTags = items.flatMap(item => item.tags || []);
  return [...new Set(allTags)].sort();
};

/**
 * 집단 추출 (중복 제거)
 * @param {Array} items - 아이템 배열
 * @returns {Array} 고유 집단 배열
 */
export const extractUniquePopulations = (items) => {
  const allPopulations = items.flatMap(item => item.populations || []);
  return [...new Set(allPopulations)].sort();
};

/**
 * 아이템 필터링
 * @param {Array} items - 아이템 배열
 * @param {Object} filters - 필터 조건
 * @returns {Array} 필터링된 아이템 배열
 */
export const filterItems = (items, filters) => {
  console.log('아이템 필터링:', { itemsCount: items.length, filters });

  let filtered = [...items];

  // 완료 상태 필터
  if (filters.showCompleted === false) {
    filtered = filtered.filter(item => !item.completed);
  }

  // 선택 항목 필터
  if (filters.showOptional === false) {
    filtered = filtered.filter(item => item.priority === 'required');
  }

  // 태그 필터
  if (filters.selectedTags && filters.selectedTags.length > 0) {
    filtered = filtered.filter(item =>
      item.tags.some(tag => filters.selectedTags.includes(tag))
    );
  }

  // 집단 필터
  if (filters.selectedPopulations && filters.selectedPopulations.length > 0) {
    filtered = filtered.filter(item =>
      item.populations.some(pop => filters.selectedPopulations.includes(pop))
    );
  }

  // 검색어 필터
  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const query = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.memo.toLowerCase().includes(query)
    );
  }

  console.log('필터링 결과:', filtered.length + '개 항목');
  return filtered;
};

/**
 * 집단 상태 결정
 * @param {Object} population - 집단 객체
 * @param {string} currentPeriod - 현재 시기
 * @returns {string} 상태 ('active' | 'pending' | 'completed')
 */
export const getPopulationStatus = (population, currentPeriod) => {
  if (!population.activePeriods || population.activePeriods.length === 0) {
    return 'pending';
  }

  if (population.activePeriods.includes(currentPeriod)) {
    return 'active';
  }

  // TODO: 실제로는 시기의 order를 비교해서 판단해야 함
  return population.currentStatus === '완료대기' ? 'pending' : 'completed';
};

/**
 * 통계 계산
 * @param {Object} project - 프로젝트 데이터
 * @returns {Object} 통계 정보
 */
export const calculateStatistics = (project) => {
  console.log('통계 계산 시작');

  const allItems = project.periods.flatMap(period => period.items);
  const completedItems = allItems.filter(item => item.completed);
  const requiredItems = allItems.filter(item => item.priority === 'required');
  const optionalItems = allItems.filter(item => item.priority === 'optional');

  const stats = {
    totalItems: allItems.length,
    completedItems: completedItems.length,
    requiredItems: requiredItems.length,
    optionalItems: optionalItems.length,
    requiredCompleted: requiredItems.filter(item => item.completed).length,
    optionalCompleted: optionalItems.filter(item => item.completed).length,
    totalProgress: calculateProgress(allItems),
    requiredProgress: calculateProgress(requiredItems),
    optionalProgress: calculateProgress(optionalItems),
    totalPopulations: project.populations.length,
    totalPeriods: project.periods.length,
    uniqueTags: extractUniqueTags(allItems).length
  };

  console.log('통계 계산 완료:', stats);
  return stats;
};

/**
 * 기간 내 여부 확인
 * @param {string} date - 확인할 날짜
 * @param {string} startDate - 시작 날짜
 * @param {string} endDate - 종료 날짜
 * @returns {boolean} 기간 내 여부
 */
export const isDateInRange = (date, startDate, endDate) => {
  const d = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);

  return d >= start && d <= end;
};

/**
 * 현재 시기 찾기
 * @param {Array} periods - 시기 배열
 * @returns {Object|null} 현재 시기 객체 또는 null
 */
export const getCurrentPeriod = (periods) => {
  const now = new Date();
  return periods.find(period =>
    isDateInRange(now, period.startDate, period.endDate)
  ) || null;
};

/**
 * 마크다운 간단 파싱 (볼드, 이탤릭)
 * @param {string} text - 마크다운 텍스트
 * @returns {string} HTML 문자열
 */
export const parseSimpleMarkdown = (text) => {
  if (!text) return '';

  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
};

/**
 * 검색 결과 하이라이트
 * @param {string} text - 원본 텍스트
 * @param {string} query - 검색어
 * @returns {string} 하이라이트된 HTML
 */
export const highlightSearchQuery = (text, query) => {
  if (!text || !query) return text;

  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
};
