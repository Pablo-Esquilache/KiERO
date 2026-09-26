const { Client } = require('pg');
const url = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    console.log("Connected to NEW DB!");
    const res = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    console.log("Tables in NEW DB:", res.rows.map(r => r.table_name));
    await client.end();
}
run().catch(console.error);
