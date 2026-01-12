const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

// 앱 데이터 경로
const userDataPath = app.getPath('userData');
const credentialsPath = path.join(userDataPath, 'credentials.json');
const settingsPath = path.join(userDataPath, 'settings.json');

let mainWindow;
let tray;
let isSidebarMode = false;
let sidebarPosition = 'right';
let normalBounds = null;
let sidebarBounds = null; // 사이드바 크기 저장

// 사이드바 크기 설정
const SIDEBAR_MAX_WIDTH = 320;
const SIDEBAR_MIN_WIDTH = 160;
const SIDEBAR_MAX_HEIGHT_RATIO = 1.0;
const SIDEBAR_MIN_HEIGHT_RATIO = 0.5;

// 자격 증명 저장
function saveCredentials(username, password, autoLogin = false) {
    const data = { username, password, autoLogin };
    fs.writeFileSync(credentialsPath, JSON.stringify(data));
    console.log('자격 증명 저장됨:', credentialsPath);

    if (autoLogin) {
        app.setLoginItemSettings({ openAtLogin: true });
    }
}

// 자격 증명 로드
function loadCredentials() {
    try {
        if (fs.existsSync(credentialsPath)) {
            const data = fs.readFileSync(credentialsPath, 'utf8');
            console.log('자격 증명 로드됨');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('자격 증명 로드 실패:', error);
    }
    return null;
}

// 자격 증명 삭제
function clearCredentials() {
    try {
        if (fs.existsSync(credentialsPath)) {
            fs.unlinkSync(credentialsPath);
            console.log('자격 증명 삭제됨');
        }
    } catch (error) {
        console.error('자격 증명 삭제 실패:', error);
    }
}

// 설정 저장
function saveSettings(settings) {
    try {
        const existing = loadSettings();
        const merged = { ...existing, ...settings };
        fs.writeFileSync(settingsPath, JSON.stringify(merged));
        console.log('설정 저장됨:', merged);
    } catch (error) {
        console.error('설정 저장 실패:', error);
    }
}

// 설정 로드
function loadSettings() {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('설정 로드 실패:', error);
    }
    return { sidebarMode: false, sidebarPosition: 'right', autoStart: false };
}

// 현재 모니터 정보 가져오기
function getCurrentDisplay() {
    const cursor = screen.getCursorScreenPoint();
    return screen.getDisplayNearestPoint(cursor);
}

// 사이드바 모드로 전환
function enterSidebarMode(position = null) {
    const display = getCurrentDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;
    const { x: screenX, y: screenY } = display.workArea;

    if (!isSidebarMode) {
        normalBounds = mainWindow.getBounds();
    }

    sidebarPosition = position || sidebarPosition;

    // 이전 사이드바 크기가 있으면 사용, 없으면 기본값
    const width = sidebarBounds?.width || SIDEBAR_MAX_WIDTH;
    const height = sidebarBounds?.height || screenHeight;

    const x = sidebarPosition === 'right'
        ? screenX + screenWidth - width
        : screenX;

    mainWindow.setBounds({
        x: x,
        y: screenY,
        width: width,
        height: height
    });

    mainWindow.setAlwaysOnTop(true);
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(SIDEBAR_MIN_WIDTH, Math.floor(screenHeight * SIDEBAR_MIN_HEIGHT_RATIO));
    mainWindow.setMaximumSize(SIDEBAR_MAX_WIDTH, screenHeight);

    isSidebarMode = true;

    saveSettings({ sidebarMode: true, sidebarPosition });
    mainWindow.webContents.send('sidebar-mode-changed', {
        isSidebar: true,
        position: sidebarPosition,
        bounds: mainWindow.getBounds()
    });
    updateTrayMenu();
}

// 일반 모드로 전환
function exitSidebarMode() {
    // 현재 사이드바 크기 저장
    if (isSidebarMode) {
        sidebarBounds = mainWindow.getBounds();
    }

    if (normalBounds) {
        mainWindow.setBounds(normalBounds);
    } else {
        const display = getCurrentDisplay();
        const { width: screenWidth, height: screenHeight } = display.workAreaSize;
        mainWindow.setBounds({
            x: Math.floor(screenWidth / 4),
            y: Math.floor(screenHeight / 4),
            width: 1200,
            height: 800
        });
    }

    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
    mainWindow.setMinimumSize(400, 300);
    mainWindow.setMaximumSize(0, 0); // 제한 없음

    isSidebarMode = false;

    saveSettings({ sidebarMode: false });
    mainWindow.webContents.send('sidebar-mode-changed', {
        isSidebar: false,
        position: sidebarPosition
    });
    updateTrayMenu();
}

// 사이드바 모드 토글
function toggleSidebarMode() {
    if (isSidebarMode) {
        exitSidebarMode();
    } else {
        enterSidebarMode();
    }
    return isSidebarMode;
}

// 사이드바 가장자리에 스냅
function snapToEdge() {
    if (!isSidebarMode) return;

    const display = getCurrentDisplay();
    const bounds = mainWindow.getBounds();
    const { width: screenWidth } = display.workAreaSize;
    const { x: screenX, y: screenY } = display.workArea;

    // 현재 위치에 따라 왼쪽 또는 오른쪽으로 스냅
    const centerX = bounds.x + bounds.width / 2;
    const screenCenterX = screenX + screenWidth / 2;

    if (centerX < screenCenterX) {
        // 왼쪽으로 스냅
        sidebarPosition = 'left';
        mainWindow.setBounds({
            ...bounds,
            x: screenX,
            y: screenY
        });
    } else {
        // 오른쪽으로 스냅
        sidebarPosition = 'right';
        mainWindow.setBounds({
            ...bounds,
            x: screenX + screenWidth - bounds.width,
            y: screenY
        });
    }

    saveSettings({ sidebarPosition });
    mainWindow.webContents.send('sidebar-position-changed', sidebarPosition);
}

// 트레이 메뉴 업데이트
function updateTrayMenu() {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
            click: () => {
                if (isSidebarMode) {
                    exitSidebarMode();
                }
                mainWindow.show();
                mainWindow.focus();
            }
        },
        {
            label: '새 메모',
            click: () => {
                mainWindow.show();
                mainWindow.webContents.send('create-note');
            }
        },
        { type: 'separator' },
        {
            label: '사이드바로 보기',
            submenu: [
                {
                    label: '왼쪽',
                    type: 'radio',
                    checked: isSidebarMode && sidebarPosition === 'left',
                    click: () => {
                        mainWindow.show();
                        enterSidebarMode('left');
                    }
                },
                {
                    label: '오른쪽',
                    type: 'radio',
                    checked: isSidebarMode && sidebarPosition === 'right',
                    click: () => {
                        mainWindow.show();
                        enterSidebarMode('right');
                    }
                }
            ]
        },
        {
            label: '시작 시 실행',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({
                    openAtLogin: menuItem.checked
                });
                saveSettings({ autoStart: menuItem.checked });
            }
        },
        { type: 'separator' },
        {
            label: '종료',
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setContextMenu(contextMenu);
}

function createWindow() {
    const settings = loadSettings();
    sidebarPosition = settings.sidebarPosition || 'right';

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 400,
        minHeight: 300,
        frame: false,
        transparent: true,
        backgroundColor: '#00000000',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    // 개발자 도구 열기 (디버깅용)
    mainWindow.webContents.openDevTools();

    // 창 닫기 방지 - 숨기기로 처리
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
            console.log('창 닫기 -> 숨김 처리');
        }
    });

    // 사이드바 모드에서 이동 후 스냅
    mainWindow.on('moved', () => {
        if (isSidebarMode) {
            snapToEdge();
        }
    });

    // 사이드바 모드에서 크기 변경 시 저장
    mainWindow.on('resized', () => {
        if (isSidebarMode) {
            sidebarBounds = mainWindow.getBounds();
            mainWindow.webContents.send('sidebar-resized', sidebarBounds);
        }
    });

    // 창이 준비되면 저장된 자격 증명 전송
    mainWindow.webContents.on('did-finish-load', () => {
        const credentials = loadCredentials();
        if (credentials && credentials.autoLogin) {
            mainWindow.webContents.send('auto-login', credentials);
        }

        mainWindow.webContents.send('init-state', {
            isSidebar: isSidebarMode,
            sidebarPosition: sidebarPosition
        });
    });
}

function createTray() {
    const iconPath = process.platform === 'win32'
        ? path.join(__dirname, 'assets', 'icon32.ico')
        : path.join(__dirname, 'assets', 'icon.png');
    let trayIcon;

    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        if (process.platform !== 'win32') {
            trayIcon = trayIcon.resize({ width: 16, height: 16 });
        }
    } catch (error) {
        console.log('트레이 아이콘 로드 실패:', error);
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);
    tray.setToolTip('스티키 노트');
    updateTrayMenu();

    tray.on('double-click', () => {
        if (isSidebarMode) {
            exitSidebarMode();
        }
        mainWindow.show();
        mainWindow.focus();
    });
}

// 앱 준비 완료
app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// 모든 창이 닫히면
app.on('window-all-closed', () => {
    // 트레이에 남아있으면 종료 안함
    if (!app.isQuitting) {
        return;
    }
    app.quit();
});

// IPC 핸들러 - 작업표시줄로 최소화 (숨기기)
ipcMain.handle('minimize-to-tray', () => {
    mainWindow.hide();
    return true;
});

// IPC 핸들러 - 트레이(사이드바) 모드 토글
ipcMain.handle('toggle-sidebar', () => {
    return toggleSidebarMode();
});

// IPC 핸들러 - 창 닫기
ipcMain.handle('close-window', () => {
    const credentials = loadCredentials();
    if (credentials && credentials.autoLogin) {
        // 자동로그인 설정됨 -> 트레이로 숨기기
        mainWindow.hide();
    } else {
        // 자동로그인 아님 -> 완전 종료
        app.isQuitting = true;
        app.quit();
    }
    return true;
});

// IPC 핸들러 - 완전 종료 (강제)
ipcMain.handle('force-quit', () => {
    app.isQuitting = true;
    app.quit();
    return true;
});

// IPC 핸들러 - 자격 증명 저장
ipcMain.handle('save-credentials', (event, username, password, autoLogin) => {
    saveCredentials(username, password, autoLogin);
    return true;
});

// IPC 핸들러 - 자격 증명 삭제
ipcMain.handle('clear-credentials', () => {
    clearCredentials();
    return true;
});

// IPC 핸들러 - 자격 증명 로드
ipcMain.handle('load-credentials', () => {
    return loadCredentials();
});

// IPC 핸들러 - 사이드바 모드 상태
ipcMain.handle('get-sidebar-mode', () => {
    return {
        isSidebar: isSidebarMode,
        position: sidebarPosition,
        bounds: isSidebarMode ? mainWindow.getBounds() : null
    };
});

// IPC 핸들러 - 사이드바 위치 설정
ipcMain.handle('set-sidebar-position', (event, position) => {
    sidebarPosition = position;
    if (isSidebarMode) {
        enterSidebarMode(position);
    }
    saveSettings({ sidebarPosition: position });
    return true;
});

// IPC 핸들러 - 사이드바 모드 종료
ipcMain.handle('exit-sidebar', () => {
    exitSidebarMode();
    return true;
});

// IPC 핸들러 - 설정 저장
ipcMain.handle('save-settings', (event, settings) => {
    saveSettings(settings);
    if (settings.autoStart !== undefined) {
        app.setLoginItemSettings({ openAtLogin: settings.autoStart });
    }
    return true;
});

// IPC 핸들러 - 설정 로드
ipcMain.handle('load-settings', () => {
    const settings = loadSettings();
    settings.autoStart = app.getLoginItemSettings().openAtLogin;
    return settings;
});

console.log('Electron 앱 시작됨');
