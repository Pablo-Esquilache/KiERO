const { Client } = require('pg');
const oldUrl = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: oldUrl });
async function run() {
    await client.connect();
    
    // Set all sales from today that have the fake "15:00:00" to the current timestamp so they appear in the box
    await client.query(`UPDATE ventas SET fecha = CURRENT_TIMESTAMP WHERE comercio_id = 1 AND fecha = '2026-09-25 15:00:00+00'`);
    
    // Also fix any gastos
    await client.query(`UPDATE gastos SET fecha = CURRENT_TIMESTAMP WHERE comercio_id = 1 AND fecha = '2026-09-25 00:00:00+00'`);
    
    console.log("Fixed timestamps for existing sales today");
    await client.end();
}
run().catch(console.error);
