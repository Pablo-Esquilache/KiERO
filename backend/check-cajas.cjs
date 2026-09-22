const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.jldwpxqlyqylttemzrmx:ki3r0app-ventas-2025!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres'
});

async function check() {
  const { rows } = await pool.query('SELECT * FROM cajas ORDER BY fecha DESC LIMIT 5;');
  console.log(rows);
  pool.end();
}
check();
