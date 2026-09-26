const { Client } = require('pg');
const url = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    await client.query("SET session_replication_role = 'replica';");
    console.log("Success! FK checks can be disabled.");
    await client.end();
}
run().catch(console.error);
