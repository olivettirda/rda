import React, { useState } from 'react';
import { changePassword, getCurrentUser } from '../lib/auth';

/**
 * 설정 컴포넌트 - 비밀번호 변경
 */
export function Settings({ onClose, onSuccess }) {
  const user = getCurrentUser();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    console.log('비밀번호 변경 폼 제출');

    // 유효성 검사
    if (newPassword.length < 4) {
      setError('새 비밀번호는 최소 4자 이상이어야 합니다');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호가 일치하지 않습니다');
      return;
    }

    if (currentPassword === newPassword) {
      setError('현재 비밀번호와 새 비밀번호가 동일합니다');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword(currentPassword, newPassword);
      console.log('비밀번호 변경 성공');

      if (onSuccess) {
        onSuccess('비밀번호가 성공적으로 변경되었습니다');
      }

      // 폼 초기화
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // 모달 닫기
      setTimeout(() => {
        if (onClose) onClose();
      }, 1500);
    } catch (err) {
      console.error('비밀번호 변경 실패:', err);
      setError(err.message || '비밀번호 변경에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-dmrt-primary-dark">설정</h2>
            <p className="text-sm text-gray-600 mt-1">
              사용자: <span className="font-medium">{user?.username}</span>
              {user?.email && <span className="text-gray-400"> ({user.email})</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="닫기"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 본문 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">비밀번호 변경</h3>
            <p className="text-sm text-gray-600">
              보안을 위해 주기적으로 비밀번호를 변경하세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 오류 메시지 */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* 현재 비밀번호 */}
            <div>
              <label htmlFor="currentPassword" className="form-label">
                현재 비밀번호
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-input"
                placeholder="현재 비밀번호를 입력하세요"
                required
                autoFocus
              />
            </div>

            {/* 새 비밀번호 */}
            <div>
              <label htmlFor="newPassword" className="form-label">
                새 비밀번호
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input"
                placeholder="새 비밀번호를 입력하세요 (최소 4자)"
                required
                minLength={4}
              />
            </div>

            {/* 새 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="form-label">
                새 비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input"
                placeholder="새 비밀번호를 다시 입력하세요"
                required
                minLength={4}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-outline"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="flex-1 btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    변경 중...
                  </span>
                ) : (
                  '비밀번호 변경'
                )}
              </button>
            </div>
          </form>

          {/* 안내 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2 font-medium">비밀번호 변경 안내:</p>
            <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside">
              <li>비밀번호는 최소 4자 이상이어야 합니다</li>
              <li>현재 비밀번호와 다른 비밀번호를 사용하세요</li>
              <li>변경 후 즉시 적용됩니다</li>
              <li>변경된 비밀번호를 잊지 않도록 주의하세요</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
