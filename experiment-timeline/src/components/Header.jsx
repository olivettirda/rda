import React from 'react';
import { calculateStatistics } from '../utils/helpers';

/**
 * 헤더 컴포넌트
 */
export function Header({ project, currentUser, onExport, onImport, onReset, onSettings, onLogout }) {
  const stats = calculateStatistics(project);

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('파일 선택:', file.name);
    onImport(file);

    // 입력 초기화 (같은 파일 재선택 가능하도록)
    event.target.value = '';
  };

  return (
    <header className="sticky top-0 z-50 bg-dmrt-primary-dark text-white shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 좌측: 프로젝트 정보 */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold mb-1">{project.projectName}</h1>
            <p className="text-sm text-white/80">{project.description}</p>
          </div>

          {/* 중앙: 진행률 */}
          <div className="flex items-center gap-6 mx-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{stats.totalProgress}%</div>
              <div className="text-xs text-white/70">전체 진행률</div>
            </div>
            <div className="h-12 w-px bg-white/30"></div>
            <div className="text-sm">
              <div className="mb-1">
                <span className="text-white/70">필수:</span>{' '}
                <span className="font-medium">{stats.requiredCompleted}/{stats.requiredItems}</span>
                {' '}
                <span className="text-white/60">({stats.requiredProgress}%)</span>
              </div>
              <div>
                <span className="text-white/70">선택:</span>{' '}
                <span className="font-medium">{stats.optionalCompleted}/{stats.optionalItems}</span>
                {' '}
                <span className="text-white/60">({stats.optionalProgress}%)</span>
              </div>
            </div>
          </div>

          {/* 우측: 사용자 정보 및 액션 버튼 */}
          <div className="flex items-center gap-3">
            {/* 사용자 정보 */}
            {currentUser && (
              <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-md text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>{currentUser.username}</span>
                {currentUser.role === 'admin' && (
                  <span className="ml-1 px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs rounded font-medium">관리자</span>
                )}
              </div>
            )}
            {/* Export 버튼 */}
            <button
              onClick={onExport}
              className="btn btn-outline border-white text-white hover:bg-white/10 min-h-[36px] text-sm"
              title="JSON 파일로 내보내기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>

            {/* Import 버튼 */}
            <label className="btn btn-outline border-white text-white hover:bg-white/10 min-h-[36px] text-sm cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
                aria-label="JSON 파일 가져오기"
              />
            </label>

            {/* Reset 버튼 */}
            <button
              onClick={onReset}
              className="btn btn-ghost text-white/70 hover:text-white hover:bg-white/10 min-h-[36px] text-sm"
              title="초기 데이터로 재설정"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>

            {/* 설정 버튼 */}
            {onSettings && (
              <button
                onClick={onSettings}
                className="btn btn-ghost text-white/70 hover:text-white hover:bg-white/10 min-h-[36px] text-sm"
                title="설정"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </button>
            )}

            {/* 로그아웃 버튼 */}
            {onLogout && (
              <button
                onClick={onLogout}
                className="btn btn-ghost text-white/70 hover:text-white hover:bg-white/10 min-h-[36px] text-sm"
                title="로그아웃"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
