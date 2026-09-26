const { Client } = require('pg');
const newUrl = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: newUrl });
async function run() {
    await client.connect();
    await client.query(`ALTER TABLE devoluciones ALTER COLUMN cliente_id DROP NOT NULL;`);
    await client.query(`ALTER TABLE devoluciones ALTER COLUMN venta_id DROP NOT NULL;`);
    console.log("Dropped NOT NULL on devoluciones");
    await client.end();
}
run().catch(console.error);
