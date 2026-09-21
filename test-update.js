import pool from './backend/db.js';
(async () => {
    try {
        const { rows } = await pool.query("UPDATE cajas SET estado = 'cerrada', hora_cierre = NOW(), total_ventas = 0, total_gastos = 0, total_devoluciones = 0, total_resultado = 0, total_cuenta_corriente = 0 WHERE id = 14 RETURNING *");
        console.log('Updated:', rows.length);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
})();
