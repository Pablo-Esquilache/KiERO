const { Client } = require('pg');
const fs = require('fs');
const url = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    const sql = fs.readFileSync('temp_schema.sql', 'utf8');
    await client.query(sql);
    console.log("Schema applied to NEW DB!");
    await client.end();
}
run().catch(console.error);
