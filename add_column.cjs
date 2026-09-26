const { Client } = require('pg');
const url = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    await client.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_abierto BOOLEAN DEFAULT false;");
    console.log("Columna agregada");
    await client.end();
}
run().catch(console.error);
