const { Client } = require('pg');
const fs = require('fs');
const url = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: url });
async function run() {
    await client.connect();
    
    const m1 = fs.readFileSync('database/migration_fase2.sql', 'utf8');
    await client.query(m1);
    console.log("migration_fase2 applied!");
    
    const m2 = fs.readFileSync('database/migration_turnos.sql', 'utf8');
    await client.query(m2);
    console.log("migration_turnos applied!");
    
    const m3 = fs.readFileSync('database/migration_ajustes.sql', 'utf8');
    await client.query(m3);
    console.log("migration_ajustes applied!");
    
    const m4 = fs.readFileSync('database/migration_fix_constraints.sql', 'utf8');
    if (m4) await client.query(m4).catch(e => console.log('Skipped fix constraints (maybe already there)'));
    
    await client.end();
}
run().catch(console.error);
