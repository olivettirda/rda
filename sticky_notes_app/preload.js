const { contextBridge, ipcRenderer } = require('electron');

// 안전한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 창 컨트롤
    closeWindow: () => ipcRenderer.invoke('close-window'),
    minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => ipcRenderer.invoke('maximize-window'),

    // 자격 증명 저장 (자동 로그인용)
    saveCredentials: (username, password, autoLogin) => {
        return ipcRenderer.invoke('save-credentials', username, password, autoLogin);
    },

    // 자격 증명 삭제 (로그아웃 시)
    clearCredentials: () => {
        return ipcRenderer.invoke('clear-credentials');
    },

    // 자격 증명 로드
    loadCredentials: () => {
        return ipcRenderer.invoke('load-credentials');
    },

    // 자동 로그인 이벤트 수신
    onAutoLogin: (callback) => {
        ipcRenderer.on('auto-login', (event, credentials) => {
            callback(credentials);
        });
    },

    // 초기 상태 이벤트 수신
    onInitState: (callback) => {
        ipcRenderer.on('init-state', (event, state) => {
            callback(state);
        });
    },

    // 새 메모 생성 이벤트 수신 (트레이 메뉴에서)
    onCreateNote: (callback) => {
        ipcRenderer.on('create-note', () => {
            callback();
        });
    },

    // 사이드바 모드 토글
    toggleSidebar: () => {
        return ipcRenderer.invoke('toggle-sidebar');
    },

    // 사이드바 모드 상태 확인
    getSidebarMode: () => {
        return ipcRenderer.invoke('get-sidebar-mode');
    },

    // 사이드바 위치 설정
    setSidebarPosition: (position) => {
        return ipcRenderer.invoke('set-sidebar-position', position);
    },

    // 사이드바 모드 종료
    exitSidebar: () => {
        return ipcRenderer.invoke('exit-sidebar');
    },

    // 사이드바 모드 변경 이벤트 수신
    onSidebarModeChanged: (callback) => {
        ipcRenderer.on('sidebar-mode-changed', (event, data) => {
            callback(data);
        });
    },

    // 설정 저장
    saveSettings: (settings) => {
        return ipcRenderer.invoke('save-settings', settings);
    },

    // 설정 로드
    loadSettings: () => {
        return ipcRenderer.invoke('load-settings');
    },

    // 플랫폼 정보
    platform: process.platform,

    // Electron 환경 확인
    isElectron: true
});

console.log('Preload 스크립트 로드됨');
