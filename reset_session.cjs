const { Client } = require('pg');
const url = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    await client.query("UPDATE usuarios SET active_session = NULL;");
    console.log("Sesiones reseteadas");
    await client.end();
}
run().catch(console.error);
