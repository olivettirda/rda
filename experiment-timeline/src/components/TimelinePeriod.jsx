import React, { useState } from 'react';
import { TimelineItem } from './TimelineItem';
import { formatDateRange, calculateProgress } from '../utils/helpers';

/**
 * 시기별 타임라인 그룹 컴포넌트
 */
export function TimelinePeriod({ period, onToggle, onMemoChange, onDelete, onAddItem, settings }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');

  // 필터링된 아이템
  const filteredItems = period.items.filter(item => {
    if (!settings.showCompleted && item.completed) return false;
    if (!settings.showOptional && item.priority === 'optional') return false;
    return true;
  });

  // 진행률 계산
  const progress = calculateProgress(period.items);
  const completedCount = period.items.filter(item => item.completed).length;
  const totalCount = period.items.length;

  // 빠른 추가 폼 제출
  const handleQuickAdd = (e) => {
    e.preventDefault();

    if (!newItemTitle.trim()) {
      alert('제목을 입력해주세요');
      return;
    }

    console.log('빠른 항목 추가:', { periodId: period.periodId, title: newItemTitle });

    onAddItem(period.periodId, {
      title: newItemTitle,
      description: newItemDescription,
      priority: 'required',
      populations: [],
      tags: []
    });

    // 폼 초기화
    setNewItemTitle('');
    setNewItemDescription('');
    setShowAddForm(false);
  };

  return (
    <div className="mb-8">
      {/* 시기 헤더 */}
      <div className="sticky top-20 z-10 bg-white border-b-2 border-dmrt-primary-main shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          {/* 좌측: 시기 정보 */}
          <div className="flex items-center gap-4">
            {/* 토글 버튼 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              aria-label={isExpanded ? '접기' : '펼치기'}
            >
              <svg
                className={`w-6 h-6 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* 시기 이름 */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-dmrt-primary-dark">
                  {period.name}
                  <span className="ml-2 text-sm font-normal text-gray-500">({period.shortName})</span>
                </h3>
                {totalCount > 0 && (
                  <span className="text-sm text-gray-600">
                    {completedCount}/{totalCount}
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {formatDateRange(period.startDate, period.endDate)}
              </div>
            </div>
          </div>

          {/* 우측: 진행률 및 액션 */}
          <div className="flex items-center gap-4">
            {/* 진행률 표시 */}
            <div className="flex items-center gap-3">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-dmrt-primary-main transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-700 min-w-[3rem]">
                {progress}%
              </span>
            </div>

            {/* 빠른 추가 버튼 */}
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="btn-sm bg-dmrt-primary-main text-white hover:bg-dmrt-accent-5 px-4 py-2 rounded flex items-center gap-1"
              title="항목 추가"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              추가
            </button>
          </div>
        </div>

        {/* 빠른 추가 폼 */}
        {showAddForm && (
          <div className="px-6 pb-4 bg-gray-50 border-t border-gray-200">
            <form onSubmit={handleQuickAdd} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="항목 제목 입력..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-dmrt-primary-main focus:border-transparent text-sm"
                  autoFocus
                />
                <input
                  type="text"
                  value={newItemDescription}
                  onChange={(e) => setNewItemDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-dmrt-primary-main focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-dmrt-primary-main text-white rounded hover:bg-dmrt-accent-5 text-sm font-medium"
                >
                  추가
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItemTitle('');
                    setNewItemDescription('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* 아이템 목록 */}
      {isExpanded && (
        <div className="px-6 py-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p>표시할 항목이 없습니다</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-dmrt-primary-main hover:underline text-sm"
              >
                + 새 항목 추가
              </button>
            </div>
          ) : (
            <div className="space-y-0">
              {filteredItems.map(item => (
                <TimelineItem
                  key={item.itemId}
                  item={item}
                  periodId={period.periodId}
                  onToggle={onToggle}
                  onMemoChange={onMemoChange}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
