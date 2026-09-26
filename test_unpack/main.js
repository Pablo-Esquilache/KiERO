

import electronPkg from 'electron';
const { app, BrowserWindow } = electronPkg;
import server from './backend/app.js'; // El Express existente
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

// Forzamos single instance lock
const gotTheLock = true;
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Si intentan abrir otra instancia, enfocamos la que ya est abierta
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    // Generar o recuperar JWT_SECRET para uso local

// Generar o recuperar JWT_SECRET para uso local
const secretPath = path.join(app.getPath('userData'), 'jwt_secret.txt');
if (fs.existsSync(secretPath)) {
  process.env.JWT_SECRET = fs.readFileSync(secretPath, 'utf8');
} else {
  const secret = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretPath, secret);
  process.env.JWT_SECRET = secret;
}

// Levantamos Express en el localhost (127.0.0.1) asignando el puerto 0 para que el SO d uno libre al azar
    const httpServer = server.listen(0, '127.0.0.1', () => {
      const port = httpServer.address().port;
      console.log("Express iniciado internamente en http://127.0.0.1:" + port);

      mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: { 
          contextIsolation: true, 
          nodeIntegration: false 
        }
      });

      mainWindow.webContents.session.clearCache();

      // Le inyectamos el puerto en la URL para que el frontend lo tome
      mainWindow.loadFile(path.join(__dirname, 'frontend/index.html'), {
        query: { apiPort: port }
      }).then(() => {
        mainWindow.webContents.executeJavaScript('localStorage.clear(); localStorage.setItem("electron_api_port", "' + port + '");');
      });
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}
