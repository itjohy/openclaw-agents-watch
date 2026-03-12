import electron from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTimelineSnapshot } from '../../shared/timeline-core.mjs';

const { app, BrowserWindow, ipcMain, Notification, shell } = electron;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = process.env.NODE_ENV !== 'production';
let mainWindow = null;
let lastNotifiedIds = new Set();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 840,
    minWidth: 390,
    minHeight: 560,
    title: 'Agent Timeline',
    backgroundColor: '#0f1115',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 14 } : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://127.0.0.1:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function notifyIfNeeded(snapshot) {
  const candidates = snapshot.pending.slice(0, 5);
  for (const task of candidates) {
    if (lastNotifiedIds.has(task.taskId)) continue;
    const body = `${task.agentId} · ${task.title}`;
    if (Notification.isSupported()) {
      new Notification({
        title: `Agent Timeline · ${task.status}`,
        body,
        silent: false,
      }).show();
    }
    lastNotifiedIds.add(task.taskId);
  }
}

ipcMain.handle('timeline:get-snapshot', async (_event, options = {}) => {
  const snapshot = getTimelineSnapshot(options);
  notifyIfNeeded(snapshot);
  return snapshot;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
