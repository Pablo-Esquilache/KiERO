const { Pool } = require('pg'); 
const pool = new Pool({ connectionString: 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres', ssl: { rejectUnauthorized: false } }); 
async function insert() { 
  try { 
    await pool.query('INSERT INTO usuarios (usuario, password, role, comercio_id) VALUES (\, \, \, \) ON CONFLICT (usuario) DO NOTHING', ['admin', '\\\.BZOsM.3EvBR1ahC4nHc2tou', 'admin', 1]); 
    console.log('Admin inserted!'); 
  } catch(e) { console.error(e); } finally { pool.end(); } 
} 
insert();
