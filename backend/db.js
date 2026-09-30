import Database from 'better-sqlite3';
import path from 'path';
import electronPkg from 'electron';
const { app } = electronPkg;
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// En Electron, los datos del usuario deben ir en userData para que no se borren al actualizar el exe
// Si no estamos en Electron (por ejemplo corriendo test local), usamos una ruta por defecto
let userDataPath;
try {
  userDataPath = app ? app.getPath('userData') : __dirname;
} catch(e) {
  userDataPath = __dirname;
}

const dbPath = path.join(userDataPath, 'kiero.db');

// Si la DB no existe, podríamos copiar una base inicial o crearla desde el schema.
// Para hacerlo fácil, simplemente ejecutamos el schema si está vacía.
let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Comprobar si la tabla comercios existe, si no, ejecutar schema-sqlite.sql
  const check = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='comercios'").get();
  if (check.count === 0) {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema-sqlite.sql'), 'utf8');
    db.exec(schemaSql);
    console.log('Base de datos inicializada desde el esquema.');
  }
} catch (error) {
  console.error('Error inicializando SQLite:', error);
}

// Convertidor de posicionales tipo Postgres ($1, $2) a SQLite (?)
function toPositional(sql, originalParams) {
  let newParams = [];
  let newSql = sql.replace(/FOR UPDATE/gi, '');
  newSql = newSql.replace(/\bNOW\(\)/gi, "CURRENT_TIMESTAMP");
  newSql = newSql.replace(/::\w+/g, ''); // Strip postgres casts like ::integer or ::date
  newSql = newSql.replace(/\$(\d+)/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    let val = originalParams[index];
    if (typeof val === 'boolean') val = val ? 1 : 0;
    newParams.push(val);
    return '?';
  });
  return { sql: newSql, params: newParams };
}
}

// Emulador del pool de pg
const pool = {
  async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      try {
        const prepared = toPositional(sql, params);
        const stmt = db.prepare(prepared.sql);
        const normalized = sql.trim().toUpperCase();
        
        if (normalized.startsWith('SELECT') || normalized.startsWith('WITH') || normalized.includes('RETURNING')) {
          const rows = stmt.all(...prepared.params);
          resolve({ rows, rowCount: rows.length });
        } else {
          const info = stmt.run(...prepared.params);
          resolve({ rows: [], rowCount: info.changes });
        }
      } catch (err) {
        console.error("Error SQL en db-sqlite:", err.message, "\nSQL:", sql, "\nParams:", params);
        reject(err);
      }
    });
  },
  
  async connect() {
    // Emulamos el cliente para transacciones
    let inTransaction = false;
    const cliente = {
      async query(sql, params = []) {
        const norm = sql.trim().toUpperCase();
        if (norm === 'BEGIN') {
          inTransaction = true;
          db.prepare('BEGIN').run();
          return;
        }
        if (norm === 'COMMIT') {
          db.prepare('COMMIT').run();
          inTransaction = false;
          return;
        }
        if (norm === 'ROLLBACK') {
          if (inTransaction) {
             db.prepare('ROLLBACK').run();
             inTransaction = false;
          }
          return;
        }
        return pool.query(sql, params);
      },
      release() {
        if (inTransaction) {
          try { db.prepare('ROLLBACK').run(); } catch(e) {}
        }
      }
    };
    return cliente;
  }
};

export default pool;

