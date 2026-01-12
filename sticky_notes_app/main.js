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
let sidebarPosition = 'right'; // 'left' or 'right'
let normalBounds = null;

// 자격 증명 저장
function saveCredentials(username, password, autoLogin = false) {
    const data = { username, password, autoLogin };
    fs.writeFileSync(credentialsPath, JSON.stringify(data));
    console.log('자격 증명 저장됨:', credentialsPath);

    // 자동 로그인이면 자동 시작도 활성화
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

// 사이드바 모드로 전환
function enterSidebarMode(position = null) {
    const display = screen.getPrimaryDisplay();
    const { width: screenWidth, height: screenHeight } = display.workAreaSize;

    if (!isSidebarMode) {
        normalBounds = mainWindow.getBounds();
    }

    const sidebarWidth = 320;
    sidebarPosition = position || sidebarPosition;

    const x = sidebarPosition === 'right'
        ? screenWidth - sidebarWidth
        : 0;

    mainWindow.setBounds({
        x: x,
        y: 0,
        width: sidebarWidth,
        height: screenHeight
    });
    mainWindow.setAlwaysOnTop(true);
    isSidebarMode = true;

    saveSettings({ sidebarMode: true, sidebarPosition });
    mainWindow.webContents.send('sidebar-mode-changed', { isSidebar: true, position: sidebarPosition });
    updateTrayMenu();
}

// 일반 모드로 전환
function exitSidebarMode() {
    if (normalBounds) {
        mainWindow.setBounds(normalBounds);
    } else {
        const display = screen.getPrimaryDisplay();
        const { width: screenWidth, height: screenHeight } = display.workAreaSize;
        mainWindow.setBounds({
            x: Math.floor(screenWidth / 4),
            y: Math.floor(screenHeight / 4),
            width: 1200,
            height: 800
        });
    }
    mainWindow.setAlwaysOnTop(false);
    isSidebarMode = false;

    saveSettings({ sidebarMode: false });
    mainWindow.webContents.send('sidebar-mode-changed', { isSidebar: false, position: sidebarPosition });
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

// 사이드바 위치 변경
function setSidebarPosition(position) {
    sidebarPosition = position;
    if (isSidebarMode) {
        enterSidebarMode(position);
    }
    saveSettings({ sidebarPosition: position });
}

// 트레이 메뉴 업데이트
function updateTrayMenu() {
    const settings = loadSettings();
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

    // 프레임 없는 윈도우 (둥근 모서리)
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 400,
        minHeight: 300,
        frame: false,  // 프레임 없음
        transparent: true,  // 투명 배경 (둥근 모서리용)
        backgroundColor: '#00000000',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    mainWindow.loadFile('index.html');

    // 최소화 시 사이드바 모드로 전환
    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        enterSidebarMode();
        mainWindow.show();
    });

    // X 버튼 클릭 시 완전 종료 (IPC로 처리)
    // 기본 close 이벤트는 앱 종료

    // 창이 준비되면 저장된 자격 증명 전송
    mainWindow.webContents.on('did-finish-load', () => {
        const credentials = loadCredentials();
        if (credentials && credentials.autoLogin) {
            mainWindow.webContents.send('auto-login', credentials);
        }

        // 사이드바 모드 상태 전송
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

// 모든 창이 닫히면 앱 종료
app.on('window-all-closed', () => {
    app.quit();
});

// IPC 핸들러 - 창 닫기 (완전 종료)
ipcMain.handle('close-window', () => {
    app.isQuitting = true;
    app.quit();
});

// IPC 핸들러 - 창 최소화 (사이드바 모드)
ipcMain.handle('minimize-window', () => {
    enterSidebarMode();
    return true;
});

// IPC 핸들러 - 창 최대화 토글
ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
    return mainWindow.isMaximized();
});

// IPC 핸들러 - 자격 증명 저장
ipcMain.handle('save-credentials', (event, username, password, autoLogin) => {
    saveCredentials(username, password, autoLogin);
    return true;
});

// IPC 핸들러 - 자격 증명 삭제 (로그아웃)
ipcMain.handle('clear-credentials', () => {
    clearCredentials();
    return true;
});

// IPC 핸들러 - 자격 증명 로드
ipcMain.handle('load-credentials', () => {
    return loadCredentials();
});

// IPC 핸들러 - 사이드바 모드 토글
ipcMain.handle('toggle-sidebar', () => {
    return toggleSidebarMode();
});

// IPC 핸들러 - 사이드바 모드 상태 확인
ipcMain.handle('get-sidebar-mode', () => {
    return { isSidebar: isSidebarMode, position: sidebarPosition };
});

// IPC 핸들러 - 사이드바 위치 설정
ipcMain.handle('set-sidebar-position', (event, position) => {
    setSidebarPosition(position);
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
