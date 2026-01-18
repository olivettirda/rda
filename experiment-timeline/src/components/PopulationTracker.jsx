import React, { useState } from 'react';

/**
 * 집단 현황 사이드바 컴포넌트
 */
export function PopulationTracker({ populations, settings, onSettingsChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all'); // all, active, pending, completed

  // 필터링된 집단
  const filteredPopulations = populations.filter(pop => {
    // 검색어 필터
    if (searchQuery && !pop.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // 상태 필터
    if (selectedFilter !== 'all') {
      const status = getStatusType(pop.currentStatus);
      if (status !== selectedFilter) return false;
    }

    return true;
  });

  // 상태 타입 결정
  function getStatusType(status) {
    if (status === '완료대기' || status === '예정') return 'pending';
    if (status === '진행중' || status === '온실' || status === '포장') return 'active';
    if (status === '완료') return 'completed';
    return 'pending';
  }

  // 상태 아이콘 및 색상
  function getStatusIcon(status) {
    const type = getStatusType(status);

    switch (type) {
      case 'active':
        return (
          <span className="w-3 h-3 rounded-full bg-dmrt-primary-main inline-block" title="진행중"></span>
        );
      case 'completed':
        return (
          <span className="w-3 h-3 rounded-full bg-dmrt-accent-4 inline-block" title="완료"></span>
        );
      default: // pending
        return (
          <span className="w-3 h-3 rounded-full border-2 border-gray-400 inline-block" title="대기중"></span>
        );
    }
  }

  return (
    <aside className="w-80 bg-bg-card border-r border-border-default overflow-y-auto h-screen sticky top-0">
      <div className="p-6">
        {/* 사이드바 헤더 */}
        <h2 className="text-lg font-bold text-dmrt-primary-dark mb-4">집단 현황</h2>

        {/* 검색 */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="집단 검색..."
              className="w-full pl-10 pr-3 py-2 border border-border-default rounded-md focus:ring-2 focus:ring-dmrt-primary-main focus:border-transparent text-sm"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* 상태 필터 */}
        <div className="mb-4 flex gap-2 text-xs">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1 rounded ${selectedFilter === 'all' ? 'bg-dmrt-primary-main text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            전체
          </button>
          <button
            onClick={() => setSelectedFilter('active')}
            className={`px-3 py-1 rounded ${selectedFilter === 'active' ? 'bg-dmrt-primary-main text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            진행중
          </button>
          <button
            onClick={() => setSelectedFilter('pending')}
            className={`px-3 py-1 rounded ${selectedFilter === 'pending' ? 'bg-dmrt-primary-main text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            대기
          </button>
        </div>

        {/* 집단 목록 */}
        <div className="space-y-2 mb-6">
          {filteredPopulations.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              검색 결과가 없습니다
            </div>
          ) : (
            filteredPopulations.map(pop => (
              <div
                key={pop.populationId}
                className="p-3 bg-white rounded-md border border-gray-200 hover:border-dmrt-primary-main transition-colors cursor-pointer"
                title={pop.notes || pop.name}
              >
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(pop.currentStatus)}
                  <span className="font-medium text-sm text-gray-900">{pop.name}</span>
                </div>
                {pop.parentPopulation && (
                  <div className="text-xs text-gray-500 ml-5">
                    ← {pop.parentPopulation}
                  </div>
                )}
                <div className="text-xs text-gray-600 ml-5 mt-1">
                  {pop.currentStatus}
                </div>
                {pop.activePeriods && pop.activePeriods.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2 ml-5">
                    {pop.activePeriods.map((period, idx) => (
                      <span key={idx} className="text-xs bg-dmrt-primary-light text-dmrt-primary-main px-2 py-0.5 rounded">
                        {period}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-300 my-6"></div>

        {/* 표시 설정 */}
        <h3 className="text-sm font-bold text-gray-700 mb-3">표시 설정</h3>

        <div className="space-y-3">
          {/* 완료 항목 표시 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showCompleted}
              onChange={(e) => {
                console.log('완료 항목 표시 토글:', e.target.checked);
                onSettingsChange({ showCompleted: e.target.checked });
              }}
              className="w-4 h-4 rounded border-gray-300 text-dmrt-primary-main focus:ring-dmrt-primary-main"
            />
            <span className="text-sm text-gray-700">완료 항목 표시</span>
          </label>

          {/* 선택 항목 표시 */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showOptional}
              onChange={(e) => {
                console.log('선택 항목 표시 토글:', e.target.checked);
                onSettingsChange({ showOptional: e.target.checked });
              }}
              className="w-4 h-4 rounded border-gray-300 text-dmrt-primary-main focus:ring-dmrt-primary-main"
            />
            <span className="text-sm text-gray-700">선택 항목 표시</span>
          </label>
        </div>

        {/* 구분선 */}
        <div className="border-t border-gray-300 my-6"></div>

        {/* 범례 */}
        <h3 className="text-sm font-bold text-gray-700 mb-3">범례</h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-dmrt-primary-main inline-block"></span>
            <span className="text-gray-600">진행중</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border-2 border-gray-400 inline-block"></span>
            <span className="text-gray-600">대기중</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-dmrt-accent-4 inline-block"></span>
            <span className="text-gray-600">완료</span>
          </div>
        </div>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-l-dmrt-primary-dark bg-white"></div>
            <span className="text-gray-600">필수 항목</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-l-4 border-l-dmrt-accent-4 bg-white"></div>
            <span className="text-gray-600">선택 항목</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
