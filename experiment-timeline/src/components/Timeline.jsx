import React from 'react';
import { TimelinePeriod } from './TimelinePeriod';

/**
 * 메인 타임라인 컴포넌트
 */
export function Timeline({ periods, settings, onToggle, onMemoChange, onDelete, onAddItem }) {
  console.log('Timeline 렌더링:', { periodsCount: periods.length });

  // 시기를 order로 정렬
  const sortedPeriods = [...periods].sort((a, b) => a.order - b.order);

  return (
    <div className="timeline-container">
      {sortedPeriods.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <svg className="w-20 h-20 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg font-medium mb-2">시기가 없습니다</p>
          <p className="text-sm">새 시기를 추가하여 실험 일정을 관리하세요</p>
        </div>
      ) : (
        sortedPeriods.map(period => (
          <TimelinePeriod
            key={period.periodId}
            period={period}
            settings={settings}
            onToggle={onToggle}
            onMemoChange={onMemoChange}
            onDelete={onDelete}
            onAddItem={onAddItem}
          />
        ))
      )}
    </div>
  );
}
