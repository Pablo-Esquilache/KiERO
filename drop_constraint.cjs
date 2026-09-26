const { Client } = require('pg');
const newUrl = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: newUrl });
async function run() {
    await client.connect();
    await client.query(`ALTER TABLE cajas DROP CONSTRAINT IF EXISTS unica_caja_por_dia;`);
    await client.query(`DROP INDEX IF EXISTS unica_caja_por_dia;`);
    console.log("Dropped unica_caja_por_dia");
    await client.end();
}
run().catch(console.error);
