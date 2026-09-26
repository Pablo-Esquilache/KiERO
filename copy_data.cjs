const { Client } = require('pg');

const oldUrl = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const newUrl = 'postgresql://postgres.ixmdsjpkectihwabmijt:rkIkhVb8uNHQh5l1@aws-0-us-west-2.pooler.supabase.com:6543/postgres';

const tables = [
  'comercios',
  'usuarios',
  'metodos_pago',
  'descuentos_config',
  'gastos_categorias',
  'clientes',
  'productos',
  'cajas',
  'ventas',
  'ventas_detalle',
  'gastos',
  'devoluciones',
  'devoluciones_detalle',
  'cuenta_corriente_movimientos',
  'configuracion_sync',
  'turnos_config',
  'turnos'
];

async function run() {
    const oldClient = new Client({ connectionString: oldUrl });
    const newClient = new Client({ connectionString: newUrl });
    await oldClient.connect();
    await newClient.connect();
    
    // Disable FK checks on new DB
    await newClient.query("SET search_path = public; SET session_replication_role = 'replica';");
    
    // Wipe any default data inserted by schemas
    for (const table of [...tables].reverse()) {
        await newClient.query(`DELETE FROM ${table}`);
    }

    for (const table of tables) {
        console.log(`Copying ${table}...`);
        const res = await oldClient.query(`SELECT * FROM ${table}`);
        if (res.rows.length === 0) {
            console.log(`- ${table} is empty`);
            continue;
        }
        
        const cols = Object.keys(res.rows[0]);
        const colNames = cols.map(c => `"${c}"`).join(', ');
        
        let placeholders = [];
        let values = [];
        
        let i = 1;
        for (const row of res.rows) {
            let rowP = [];
            for (const col of cols) {
                rowP.push(`$${i}`);
                values.push(row[col]);
                i++;
            }
            placeholders.push(`(${rowP.join(', ')})`);
        }
        
        const query = `INSERT INTO ${table} (${colNames}) VALUES ${placeholders.join(', ')}`;
        await newClient.query(query, values);
        console.log(`- Copied ${res.rows.length} rows to ${table}`);
    }
    
    // Re-enable FK checks
    await newClient.query("SET session_replication_role = 'origin';");
    
    // Reset sequences
    for (const table of tables) {
        try {
            await newClient.query(`SELECT setval('"${table}_id_seq"', COALESCE((SELECT MAX(id)+1 FROM "${table}"), 1), false)`);
        } catch(e) {}
    }
    
    console.log("ALL DATA COPIED SUCCESSFULLY!");
    
    await oldClient.end();
    await newClient.end();
}
run().catch(console.error);

