const { Client } = require('pg');
const oldUrl = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: oldUrl });
async function run() {
    await client.connect();
    const res = await client.query(`SELECT id, fecha, estado FROM cajas`);
    console.log(res.rows);
    await client.end();
}
run().catch(console.error);
