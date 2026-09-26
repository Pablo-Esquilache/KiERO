PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS comercios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    umbral_stock INTEGER DEFAULT 3
);

CREATE TABLE IF NOT EXISTS cajas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    saldo_inicial REAL DEFAULT 0 NOT NULL,
    estado TEXT DEFAULT 'abierta' NOT NULL,
    hora_apertura TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hora_cierre TEXT,
    total_ventas REAL DEFAULT 0,
    total_gastos REAL DEFAULT 0,
    total_devoluciones REAL DEFAULT 0,
    total_resultado REAL DEFAULT 0,
    total_cuenta_corriente REAL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    fecha_nacimiento TEXT,
    genero TEXT,
    telefono TEXT,
    email TEXT,
    localidad TEXT,
    comentarios TEXT,
    comercio_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cuenta_corriente_movimientos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    comercio_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    monto REAL NOT NULL,
    venta_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devoluciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER,
    cliente_id INTEGER NOT NULL,
    fecha TEXT DEFAULT CURRENT_TIMESTAMP,
    total REAL NOT NULL,
    comercio_id INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS devoluciones_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    devolucion_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS gastos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    descripcion TEXT NOT NULL,
    tipo TEXT,
    fecha TEXT NOT NULL,
    importe REAL NOT NULL,
    comercio_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    categoria TEXT,
    precio REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    comercio_id INTEGER NOT NULL,
    codigo_barras TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' NOT NULL,
    comercio_id INTEGER,
    active_session TEXT,
    last_login TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha TEXT,
    cliente_id INTEGER,
    metodo_pago TEXT,
    total REAL NOT NULL,
    comercio_id INTEGER NOT NULL,
    total_bruto REAL DEFAULT 0 NOT NULL,
    descuento_monto REAL DEFAULT 0 NOT NULL,
    descuento_porcentaje REAL DEFAULT 0 NOT NULL
);

CREATE TABLE IF NOT EXISTS ventas_detalle (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    venta_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS configuracion_sync (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL,
    api_token TEXT,
    sync_enabled INTEGER DEFAULT 0,
    api_url TEXT DEFAULT 'http://127.0.0.1:3000/api/sync'
);

CREATE TABLE IF NOT EXISTS metodos_pago (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS descuentos_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL,
    porcentaje REAL NOT NULL,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gastos_categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL,
    nombre TEXT NOT NULL,
    activo INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS turnos_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL UNIQUE,
    modulo_habilitado INTEGER DEFAULT 1,
    hora_inicio_laboral TEXT DEFAULT '08:00:00',
    hora_fin_laboral TEXT DEFAULT '20:00:00',
    intervalo_minutos INTEGER DEFAULT 30,
    permitir_solapamiento INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    comercio_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    servicio_motivo TEXT,
    estado TEXT DEFAULT 'reservado' NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO comercios (id, nombre) VALUES (1, 'Mi Comercio Local');
INSERT OR IGNORE INTO usuarios (id, comercio_id, usuario, password, role) 
VALUES (1, 1, 'admin', '$2b$10$Mf0z.AIw5MwSYUl6SB5xPecTRI/TT3pnsykGtDjn6/b74Jotbq/za', 'admin');
INSERT OR IGNORE INTO metodos_pago (comercio_id, nombre) VALUES (1, 'Efectivo'), (1, 'Dbito'), (1, 'QR'), (1, 'Transferencia'), (1, 'Cuenta Corriente');
INSERT OR IGNORE INTO descuentos_config (comercio_id, porcentaje) VALUES (1, 0), (1, 5), (1, 10), (1, 15), (1, 20);