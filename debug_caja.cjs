const { Client } = require('pg');
const oldUrl = 'postgresql://postgres.dmqtfgksscxeenxbxxcj:75xbGRtEP78NqxW5@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
const client = new Client({ connectionString: oldUrl });
async function run() {
    await client.connect();
    
    // Check the active caja for comercio 1
    const cajas = await client.query(`SELECT id, fecha, hora_apertura, hora_cierre, estado FROM cajas WHERE comercio_id = 1 AND estado = 'abierta' ORDER BY hora_apertura DESC LIMIT 1`);
    console.log("Active Caja:", cajas.rows);
    
    if (cajas.rows.length > 0) {
        const apertura = cajas.rows[0].hora_apertura;
        // Check ventas since apertura
        const ventas = await client.query(`SELECT id, fecha, total, metodo_pago FROM ventas WHERE comercio_id = 1 AND fecha >= $1`, [apertura]);
        console.log("Ventas since apertura:", ventas.rows);
        
        // Check ALL ventas today
        const ventasHoy = await client.query(`SELECT id, fecha, total, metodo_pago FROM ventas WHERE comercio_id = 1 AND fecha::date = CURRENT_DATE`);
        console.log("Ventas hoy (CURRENT_DATE):", ventasHoy.rows);
        
        // Check literally latest 5 ventas
        const latest = await client.query(`SELECT id, fecha, total, metodo_pago FROM ventas WHERE comercio_id = 1 ORDER BY fecha DESC LIMIT 5`);
        console.log("Latest 5 ventas:", latest.rows);
    }
    
    await client.end();
}
run().catch(console.error);
