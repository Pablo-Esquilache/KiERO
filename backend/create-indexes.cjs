require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://kiero_user:kiero_pass@localhost:5432/kiero_db'
});

async function createIndexes() {
  const queries = [
    "CREATE INDEX IF NOT EXISTS idx_ventas_comercio_fecha ON ventas (comercio_id, fecha DESC, id DESC);",
    "CREATE INDEX IF NOT EXISTS idx_ventas_detalle_venta ON ventas_detalle (venta_id);",
    "CREATE INDEX IF NOT EXISTS idx_ventas_detalle_producto ON ventas_detalle (producto_id);",
    "CREATE INDEX IF NOT EXISTS idx_productos_comercio_nombre ON productos (comercio_id, nombre);",
    "CREATE INDEX IF NOT EXISTS idx_clientes_comercio ON clientes (comercio_id);",
    "CREATE INDEX IF NOT EXISTS idx_gastos_comercio_fecha ON gastos (comercio_id, fecha DESC);",
    "CREATE INDEX IF NOT EXISTS idx_cajas_comercio_fecha ON cajas (comercio_id, fecha DESC);",
    "CREATE INDEX IF NOT EXISTS idx_devoluciones_comercio_fecha ON devoluciones (comercio_id, fecha DESC);",
    "CREATE INDEX IF NOT EXISTS idx_cc_mov_cliente ON cuenta_corriente_movimientos (cliente_id);",
    "CREATE INDEX IF NOT EXISTS idx_turnos_comercio_fecha ON turnos (comercio_id, fecha);"
  ];

  try {
    for (const q of queries) {
      console.log("Executing:", q);
      await pool.query(q);
    }
    console.log("All indexes created successfully!");
  } catch (err) {
    console.error("Error creating indexes:", err);
  } finally {
    await pool.end();
  }
}

createIndexes();
