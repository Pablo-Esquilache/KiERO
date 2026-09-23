import { Pool } from 'pg';
const pool = new Pool({ connectionString: 'postgresql://postgres.ryfktvbbjopydldstbmm:S5V23h1299yM_@aws-0-sa-east-1.pooler.supabase.com:6543/postgres' });
async function check() {
  try {
    const res = await pool.query("SELECT id, fecha, descripcion, importe FROM gastos ORDER BY id DESC LIMIT 5");
    console.log("Gastos recientes:");
    res.rows.forEach(r => console.log(r.id, '|', r.fecha, '|', typeof r.fecha, '|', r.descripcion));
    
    const types = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'gastos'");
    console.log("\\nSchema:");
    types.rows.forEach(r => console.log(r.column_name, r.data_type));
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
check();
