import { app, BrowserWindow } from 'electron';
import { join } from 'path';
import { spawn, ChildProcess } from 'child_process';

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;

function startBackend() {
  const serverPath = join(__dirname, '../backend/dist/server.js');
  backendProcess = spawn(process.execPath, [serverPath], {
    env: { ...process.env, PORT: '3001', API_TOKEN: process.env.API_TOKEN || 'desktop-token' },
    stdio: 'inherit'
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true,
    icon: join(__dirname, '../assets/icon.icns'),
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexHtml = join(__dirname, '../frontend/dist/index.html');
  mainWindow.loadFile(indexHtml);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) backendProcess.kill();
});
