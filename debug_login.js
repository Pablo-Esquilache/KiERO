import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import electronPkg from 'electron';
import bcrypt from 'bcryptjs';

const { app } = electronPkg;
app.name = 'app-ventas-web';

app.whenReady().then(async () => {
  try {
    const dbPath = path.join(app.getPath('userData'), 'kiero.db');
    console.log('DB Path:', dbPath);
    if (!fs.existsSync(dbPath)) {
        console.log('DB NO EXISTE!');
    } else {
        const db = new Database(dbPath);
        const user = db.prepare('SELECT * FROM usuarios WHERE usuario = ?').get('admin');
        console.log('User in DB:', user);
        
        if (user) {
            console.log('Password hash en DB:', user.password);
            const match = await bcrypt.compare('123456', user.password);
            console.log('Bcrypt match con 123456:', match);
            
            // Si est mal, forzar el fix
            if (!match) {
                console.log('Forzando el fix de nuevo...');
                const hash = bcrypt.hashSync('123456', 10);
                db.prepare('UPDATE usuarios SET password = ? WHERE usuario = ?').run(hash, 'admin');
                console.log('Fix aplicado. Hash nuevo:', hash);
            }
        } else {
            console.log('Usuario no encontrado.');
        }
    }
  } catch (err) {
    console.error('ERROR:', err);
  }
  app.quit();
});
