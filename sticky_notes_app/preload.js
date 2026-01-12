const { contextBridge, ipcRenderer } = require('electron');

// 안전한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
    // 자격 증명 저장 (자동 로그인용)
    saveCredentials: (username, password) => {
        return ipcRenderer.invoke('save-credentials', username, password);
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

    // 새 메모 생성 이벤트 수신 (트레이 메뉴에서)
    onCreateNote: (callback) => {
        ipcRenderer.on('create-note', () => {
            callback();
        });
    },

    // 플랫폼 정보
    platform: process.platform,

    // Electron 환경 확인
    isElectron: true
});

console.log('Preload 스크립트 로드됨');
