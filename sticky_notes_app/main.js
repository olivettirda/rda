const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// 앱 데이터 경로
const userDataPath = app.getPath('userData');
const credentialsPath = path.join(userDataPath, 'credentials.json');

let mainWindow;
let tray;

// 자격 증명 저장
function saveCredentials(username, password) {
    const data = { username, password };
    fs.writeFileSync(credentialsPath, JSON.stringify(data));
    console.log('자격 증명 저장됨:', credentialsPath);
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

function createWindow() {
    // 메인 윈도우 생성
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 400,
        minHeight: 300,
        frame: true,
        transparent: false,
        backgroundColor: '#667eea',
        icon: path.join(__dirname, 'assets', 'icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // HTML 파일 로드
    mainWindow.loadFile('index.html');

    // 개발자 도구 (개발 중에만 사용)
    // mainWindow.webContents.openDevTools();

    // 창 닫기 시 트레이로 최소화 (완전 종료 방지)
    mainWindow.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
    });

    // 창이 준비되면 저장된 자격 증명 전송
    mainWindow.webContents.on('did-finish-load', () => {
        const credentials = loadCredentials();
        if (credentials) {
            mainWindow.webContents.send('auto-login', credentials);
        }
    });
}

function createTray() {
    // 트레이 아이콘 (16x16 또는 32x32)
    const iconPath = path.join(__dirname, 'assets', 'icon.png');
    let trayIcon;

    try {
        trayIcon = nativeImage.createFromPath(iconPath);
        trayIcon = trayIcon.resize({ width: 16, height: 16 });
    } catch (error) {
        // 아이콘이 없으면 기본 아이콘 사용
        trayIcon = nativeImage.createEmpty();
    }

    tray = new Tray(trayIcon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '열기',
            click: () => {
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
            label: '시작 시 실행',
            type: 'checkbox',
            checked: app.getLoginItemSettings().openAtLogin,
            click: (menuItem) => {
                app.setLoginItemSettings({
                    openAtLogin: menuItem.checked
                });
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

    tray.setToolTip('스티키 노트');
    tray.setContextMenu(contextMenu);

    // 트레이 더블클릭으로 창 열기
    tray.on('double-click', () => {
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

// 모든 창이 닫혀도 앱 유지 (트레이)
app.on('window-all-closed', () => {
    // macOS가 아닌 경우에도 앱 유지
});

// 앱 종료 전
app.on('before-quit', () => {
    app.isQuitting = true;
});

// IPC 핸들러 - 자격 증명 저장
ipcMain.handle('save-credentials', (event, username, password) => {
    saveCredentials(username, password);
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

console.log('Electron 앱 시작됨');
