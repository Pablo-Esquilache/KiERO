import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');
import path from 'path';
import electronPkg from 'electron';
const { app, dialog } = electronPkg || {};
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

// Runner de migraciones versionadas de SQLite usando PRAGMA user_version
function runMigrations(database, dataDir, databaseFilePath) {
  const currentVersion = database.pragma('user_version', { simple: true });

  // Lista de migraciones versionadas
  // IMPORTANTE: Cada migración se agrega de forma secuencial con su feature correspondiente.
  // Una vez desplegada a clientes, una migración no se modifica ni se reordena.
  const migrations = [
    {
      v: 1,
      name: "Agregar columna proveedor a productos",
      sql: `ALTER TABLE productos ADD COLUMN proveedor TEXT;`
    },
    {
      v: 2,
      name: "Crear tablas de log de aumentos masivos de precios",
      sql: `
        CREATE TABLE IF NOT EXISTS log_aumentos_precios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comercio_id INTEGER NOT NULL,
          usuario_id INTEGER,
          proveedor TEXT,
          porcentaje REAL NOT NULL,
          tipo_redondeo TEXT DEFAULT 'centavo',
          cantidad_productos INTEGER NOT NULL,
          revertido INTEGER DEFAULT 0,
          fecha TEXT DEFAULT (datetime('now','localtime'))
        );
        CREATE TABLE IF NOT EXISTS log_aumentos_precios_detalle (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          log_id INTEGER NOT NULL REFERENCES log_aumentos_precios(id),
          producto_id INTEGER NOT NULL,
          precio_anterior REAL NOT NULL,
          precio_nuevo REAL NOT NULL
        );
      `
    },
    {
      v: 3,
      name: "Agregar columnas fiscales a clientes",
      sql: `
        ALTER TABLE clientes ADD COLUMN cuit TEXT;
        ALTER TABLE clientes ADD COLUMN condicion_iva TEXT DEFAULT 'Consumidor Final';
        ALTER TABLE clientes ADD COLUMN domicilio_fiscal TEXT;
      `
    },
    {
      v: 4,
      name: "Crear tabla de configuracion_fiscal para AFIP/ARCA",
      sql: `
        CREATE TABLE IF NOT EXISTS configuracion_fiscal (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          comercio_id INTEGER UNIQUE NOT NULL,
          cuit TEXT,
          punto_venta INTEGER DEFAULT 1,
          condicion_iva TEXT DEFAULT 'Monotributo',
          ambiente TEXT DEFAULT 'homologacion',
          certificado_cargado INTEGER DEFAULT 0,
          clave_privada_cargada INTEGER DEFAULT 0,
          vencimiento_certificado TEXT,
          created_at TEXT DEFAULT (datetime('now','localtime')),
          updated_at TEXT DEFAULT (datetime('now','localtime'))
        );
      `
    },
    {
      v: 5,
      name: "Agregar columnas fiscales a ventas",
      sql: `
        ALTER TABLE ventas ADD COLUMN tipo_comprobante TEXT DEFAULT 'Ticket';
        ALTER TABLE ventas ADD COLUMN punto_venta INTEGER;
        ALTER TABLE ventas ADD COLUMN numero_comprobante INTEGER;
        ALTER TABLE ventas ADD COLUMN cae TEXT;
        ALTER TABLE ventas ADD COLUMN vto_cae TEXT;
        ALTER TABLE ventas ADD COLUMN resultado_afip TEXT;
        ALTER TABLE ventas ADD COLUMN observaciones_afip TEXT;
        ALTER TABLE ventas ADD COLUMN codigo_qr_afip TEXT;
      `
    },
    {
      v: 6,
      name: "Agregar columna alicuota_iva a productos",
      sql: `
        ALTER TABLE productos ADD COLUMN alicuota_iva REAL DEFAULT 21.0;
      `
    }
  ];

  const maxVersion = migrations.length > 0 ? Math.max(...migrations.map(m => m.v)) : 0;

  // Verificación de seguridad: si la base fue abierta previamente por una versión más nueva del sistema
  if (currentVersion > maxVersion) {
    throw new Error(
      `La base de datos tiene la versión de esquema ${currentVersion}, pero esta versión del sistema solo soporta hasta la versión ${maxVersion}. Actualice la aplicación.`
    );
  }

  // Filtrar migraciones pendientes
  const pending = migrations.filter(m => m.v > currentVersion);

  if (pending.length > 0) {
    console.log(`[MIGRACIONES] Se detectaron ${pending.length} migraciones pendientes. Versión actual: ${currentVersion}.`);

    // Backup de seguridad obligatorio antes de aplicar cualquier cambio
    try {
      const backupPath = path.join(dataDir, 'kiero.db.bak');
      fs.copyFileSync(databaseFilePath, backupPath);
      console.log(`[MIGRACIONES] Backup de seguridad creado exitosamente en: ${backupPath}`);
    } catch (bErr) {
      throw new Error(`No se pudo crear el backup de seguridad previo a la migración: ${bErr.message}`);
    }

    // Ejecutar cada migración en su propia transacción atómica
    for (const m of pending) {
      console.log(`[MIGRACIONES] Aplicando migración v${m.v} (${m.name || 'Sin nombre'})...`);
      database.transaction(() => {
        database.exec(m.sql);
        database.pragma(`user_version = ${m.v}`);
      })();
      console.log(`[MIGRACIONES] Migración v${m.v} aplicada exitosamente.`);
    }

    const finalVersion = database.pragma('user_version', { simple: true });
    console.log(`[MIGRACIONES] Todas las migraciones fueron aplicadas. Versión final: ${finalVersion}.`);
  }
}

let db;
try {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Migraciones automáticas silenciosas heredadas
  try { db.prepare("ALTER TABLE ventas_detalle ADD COLUMN producto_nombre TEXT").run(); } catch(e) {}
  try { db.prepare("ALTER TABLE devoluciones_detalle ADD COLUMN producto_nombre TEXT").run(); } catch(e) {}

  // Comprobar si la tabla comercios existe, si no, ejecutar schema-sqlite.sql
  const check = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='comercios'").get();
  if (check.count === 0) {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema-sqlite.sql'), 'utf8');
    db.exec(schemaSql);
    console.log('Base de datos inicializada desde el esquema.');
  }

  // Ejecución del runner de migraciones versionadas
  runMigrations(db, userDataPath, dbPath);
} catch (error) {
  console.error('ERROR CRÍTICO: Fallo al inicializar o migrar la base de datos:', error);
  if (dialog && typeof dialog.showErrorBox === 'function') {
    try {
      dialog.showErrorBox(
        'Error crítico en la base de datos',
        'Ocurrió un error al inicializar o migrar la base de datos local:\n\n' +
        (error.message || String(error)) +
        '\n\nLa aplicación se detendrá para proteger sus datos.'
      );
    } catch (dErr) {}
  }
  throw error;
}

// Convertidor de posicionales tipo Postgres ($1, $2) a SQLite (?)
function toPositional(sql, originalParams) {
  let newParams = [];
  let newSql = sql.replace(/FOR UPDATE/gi, '');
  newSql = newSql.replace(/\bNOW\(\)/gi, "datetime('now', 'localtime')");
  newSql = newSql.replace(/\bCURRENT_DATE\b/gi, "date('now', 'localtime')");
  newSql = newSql.replace(/::\w+/g, ''); // Strip postgres casts like ::integer or ::date
  newSql = newSql.replace(/\$(\d+)/g, (match, p1) => {
    const index = parseInt(p1, 10) - 1;
    let val = originalParams[index];
    if (val === undefined) val = null;
    if (typeof val === 'boolean') val = val ? 1 : 0;
    newParams.push(val);
    return '?';
  });
  return { sql: newSql, params: newParams };
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

export { userDataPath, db };
export default pool;
