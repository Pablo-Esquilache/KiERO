const { Client } = require('pg');
const url = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    console.log("Connected to OLD DB!");
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log("Tables in OLD DB:", res.rows.map(r => r.table_name));
    await client.end();
}
run().catch(console.error);
