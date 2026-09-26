const { Client } = require('pg');
const urls = [
    'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-east-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-sa-east-1.pooler.supabase.com:6543/postgres',
    'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-sa-east-1.pooler.supabase.com:5432/postgres',
    'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-east-1.pooler.supabase.com:5432/postgres'
];
async function run() {
    for (const url of urls) {
        console.log("Testing:", url);
        const client = new Client({ connectionString: url });
        try {
            await client.connect();
            console.log("SUCCESS:", url);
            await client.end();
            return;
        } catch (e) {
            console.log("FAILED:", e.message);
        }
    }
}
run();
