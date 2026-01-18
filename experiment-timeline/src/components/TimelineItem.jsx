import React, { useState } from 'react';
import { formatDateKorean } from '../utils/helpers';

/**
 * 개별 실험 항목 컴포넌트
 */
export function TimelineItem({ item, periodId, onToggle, onMemoChange, onDelete }) {
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState(item.memo || '');

  // 우선순위에 따른 스타일
  const priorityClass = item.priority === 'required'
    ? 'border-l-4 border-l-dmrt-primary-dark'
    : 'border-l-4 border-l-dmrt-accent-4';

  // 완료 상태에 따른 스타일
  const completedClass = item.completed
    ? 'opacity-70 bg-gray-50'
    : 'bg-white';

  const textClass = item.completed
    ? 'line-through text-gray-500'
    : '';

  // 체크박스 변경 핸들러
  const handleCheckboxChange = () => {
    console.log('체크박스 클릭:', { itemId: item.itemId, currentState: item.completed });
    onToggle(periodId, item.itemId);
  };

  // 메모 저장
  const handleMemoSave = () => {
    console.log('메모 저장:', { itemId: item.itemId, memoLength: memoText.length });
    onMemoChange(periodId, item.itemId, memoText);
    setIsEditingMemo(false);
  };

  // 메모 취소
  const handleMemoCancel = () => {
    console.log('메모 편집 취소');
    setMemoText(item.memo || '');
    setIsEditingMemo(false);
  };

  // 삭제 확인
  const handleDelete = () => {
    if (window.confirm(`"${item.title}" 항목을 삭제하시겠습니까?`)) {
      console.log('아이템 삭제 확인:', item.itemId);
      onDelete(periodId, item.itemId);
    }
  };

  return (
    <div className={`rounded-lg shadow-card hover:shadow-card-hover transition-shadow duration-200 ${priorityClass} ${completedClass} mb-3`}>
      <div className="p-4">
        {/* 상단: 체크박스 + 제목 + 액션 버튼 */}
        <div className="flex items-start gap-3">
          {/* 체크박스 */}
          <input
            type="checkbox"
            checked={item.completed}
            onChange={handleCheckboxChange}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-dmrt-primary-main focus:ring-dmrt-primary-main focus:ring-offset-0 cursor-pointer"
            aria-label={`${item.title} 완료 여부`}
          />

          {/* 내용 */}
          <div className="flex-1 min-w-0">
            {/* 제목 */}
            <h4 className={`font-medium text-base mb-1 ${textClass}`}>
              {item.title}
              {item.priority === 'optional' && (
                <span className="ml-2 text-xs text-dmrt-accent-4 font-normal">(선택)</span>
              )}
            </h4>

            {/* 설명 */}
            {item.description && (
              <p className={`text-sm text-gray-600 mb-2 ${textClass}`}>
                {item.description}
              </p>
            )}

            {/* 집단 태그 */}
            {item.populations && item.populations.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.populations.map((pop, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-dmrt-primary-main text-white rounded"
                  >
                    {pop}
                  </span>
                ))}
              </div>
            )}

            {/* 태그 */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {item.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* 메모 표시/편집 */}
            {!isEditingMemo && item.memo && (
              <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded text-sm text-gray-700">
                <div className="font-medium text-xs text-yellow-700 mb-1">📝 메모</div>
                <div className="whitespace-pre-wrap">{item.memo}</div>
              </div>
            )}

            {/* 메모 편집 모드 */}
            {isEditingMemo && (
              <div className="mt-2">
                <textarea
                  value={memoText}
                  onChange={(e) => setMemoText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-dmrt-primary-main focus:border-transparent text-sm"
                  rows={3}
                  placeholder="메모를 입력하세요..."
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleMemoSave}
                    className="btn-sm bg-dmrt-primary-main text-white hover:bg-dmrt-accent-5 px-3 py-1 rounded text-xs"
                  >
                    저장
                  </button>
                  <button
                    onClick={handleMemoCancel}
                    className="btn-sm bg-gray-200 text-gray-700 hover:bg-gray-300 px-3 py-1 rounded text-xs"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}

            {/* 완료 일시 */}
            {item.completed && item.completedAt && (
              <div className="text-xs text-gray-500 mt-2">
                ✓ 완료: {formatDateKorean(item.completedAt)}
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="flex flex-col gap-1">
            {/* 메모 버튼 */}
            <button
              onClick={() => setIsEditingMemo(!isEditingMemo)}
              className="p-2 text-gray-400 hover:text-dmrt-primary-main hover:bg-dmrt-primary-light rounded transition-colors"
              title={item.memo ? '메모 수정' : '메모 추가'}
              aria-label={item.memo ? '메모 수정' : '메모 추가'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* 삭제 버튼 */}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-status-error hover:bg-red-50 rounded transition-colors"
              title="항목 삭제"
              aria-label="항목 삭제"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
