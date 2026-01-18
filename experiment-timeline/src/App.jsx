import React, { useState } from 'react';
import { Header } from './components/Header';
import { Timeline } from './components/Timeline';
import { PopulationTracker } from './components/PopulationTracker';
import { useExperiments } from './hooks/useExperiments';
import { exportToJSON, importFromJSON } from './utils/storage';

/**
 * 메인 애플리케이션 컴포넌트
 */
function App() {
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
        onExport={handleExport}
        onImport={handleImport}
        onReset={handleReset}
      />

      {/* 메인 컨텐츠 */}
      <div className="flex">
        {/* 사이드바 */}
        <PopulationTracker
          populations={project.populations}
          settings={project.settings}
          onSettingsChange={updateSettings}
        />

        {/* 타임라인 */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto max-w-6xl py-6">
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
