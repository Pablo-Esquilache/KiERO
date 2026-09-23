import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({ connectionString: 'postgresql://postgres.ryfktvbbjopydldstbmm:S5V23h1299yM_@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });
async function check() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gastos'");
    console.log(res.rows);
    const g = await pool.query("SELECT * FROM gastos ORDER BY id DESC LIMIT 3");
    console.log(g.rows);
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
