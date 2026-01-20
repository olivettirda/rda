import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { PopulationTracker } from './components/PopulationTracker';
import { Login } from './components/Login';
import { useExperiments } from './hooks/useExperiments';
import { exportToJSON, importFromJSON } from './utils/storage';
import { getCurrentUser, logout } from './lib/auth';

/**
 * 메인 애플리케이션 컴포넌트
 */
function App() {
  console.log('App 컴포넌트 렌더링');

  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 확인
  useEffect(() => {
    console.log('세션 확인 중');
    const user = getCurrentUser();
    setCurrentUser(user);
    setIsLoading(false);
    console.log('세션 확인 완료:', user ? `사용자 ${user.username}` : '미로그인');
  }, []);

  // 로그인 성공 핸들러
  const handleLoginSuccess = (user) => {
    console.log('로그인 성공, 사용자 설정:', user);
    setCurrentUser(user);
  };

  // 로그아웃 핸들러
  const handleLogout = () => {
    console.log('로그아웃 처리');
    logout();
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-dmrt-primary-main mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 미로그인 상태: 로그인 화면 표시
  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 로그인 상태: 메인 화면 표시
  console.log('App 컴포넌트 렌더링');

  const {
    project,
    toggleItem,
    updateMemo,
    addItem,
    deleteItem,
    updateSettings,
    setProjectData,
    resetProject
  } = useExperiments();

  const [toastMessage, setToastMessage] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 토스트 메시지 표시
  const showToast = (message, type = 'success') => {
    console.log('토스트 표시:', { message, type });
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Export 핸들러
  const handleExport = () => {
    try {
      console.log('Export 시작');
      exportToJSON(project);
      showToast('프로젝트를 JSON 파일로 저장했습니다', 'success');
    } catch (error) {
      console.error('Export 오류:', error);
      showToast('파일 저장 중 오류가 발생했습니다', 'error');
    }
  };

  // Import 핸들러
  const handleImport = async (file) => {
    try {
      console.log('Import 시작:', file.name);

      const data = await importFromJSON(file);

      if (window.confirm('현재 프로젝트 데이터를 가져온 데이터로 교체하시겠습니까?\n기존 데이터는 삭제됩니다.')) {
        setProjectData(data);
        showToast('프로젝트를 불러왔습니다', 'success');
      }
    } catch (error) {
      console.error('Import 오류:', error);
      showToast(error.message || '파일 불러오기 중 오류가 발생했습니다', 'error');
    }
  };

  // Reset 핸들러
  const handleReset = () => {
    if (window.confirm('초기 데이터로 재설정하시겠습니까?\n현재 데이터는 삭제됩니다.')) {
      console.log('프로젝트 초기화');
      resetProject();
      showToast('프로젝트를 초기화했습니다', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* 헤더 */}
      <Header
        project={project}
        currentUser={currentUser}
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
        onLogout={handleLogout}
      />

      {/* 메인 컨텐츠 */}
      <div className="relative flex">
        {/* 모바일 사이드바 토글 버튼 */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 z-50 bg-dmrt-primary-dark text-white w-14 h-14 rounded-full shadow-lg hover:bg-dmrt-primary-main transition-all duration-200 flex items-center justify-center"
          aria-label="집단 정보 토글"
        >
          {isSidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* 모바일 오버레이 */}
        {isSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* 사이드바 */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 h-screen z-40
            transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <PopulationTracker
            populations={project.populations}
            settings={project.settings}
            onSettingsChange={updateSettings}
          />
        </aside>

        {/* 타임라인 */}
        <main className="flex-1 overflow-y-auto w-full">
          <div className="container mx-auto max-w-6xl py-6 px-4 lg:px-6">
            <Timeline
              periods={project.periods}
              settings={project.settings}
              onToggle={toggleItem}
              onMemoChange={updateMemo}
              onDelete={deleteItem}
              onAddItem={addItem}
            />
          </div>
        </main>
      </div>

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-[9999] animate-slide-in">
          <div className={`toast ${toastMessage.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <div className="flex-1">
              <div className="font-medium text-sm">
                {toastMessage.type === 'error' ? '❌ 오류' : '✓ 성공'}
              </div>
              <div className="text-sm">{toastMessage.message}</div>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="닫기"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
