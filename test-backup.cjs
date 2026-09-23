const db = require('./backend/db.js').default;

async function test() {
  try {
    const comercio_id = 1;
    const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cuenta_corriente_movimientos", "turnos", "configuracion_sync", "usuarios"];

    for (const tabla of tablas) {
      console.log('Testing', tabla);
      let queryStr = "SELECT * FROM " + tabla + " WHERE comercio_id = $1";
      if (tabla === 'ventas_detalle') {
        queryStr = "SELECT vd.* FROM ventas_detalle vd JOIN ventas v ON v.id = vd.venta_id WHERE v.comercio_id = $1";
      } else if (tabla === 'devoluciones_detalle') {
        queryStr = "SELECT dd.* FROM devoluciones_detalle dd JOIN devoluciones d ON d.id = dd.devolucion_id WHERE d.comercio_id = $1";
      } else if (tabla === 'cuenta_corriente_movimientos') {
        queryStr = "SELECT ccm.* FROM cuenta_corriente_movimientos ccm JOIN clientes c ON c.id = ccm.cliente_id WHERE c.comercio_id = $1";
      }
      
      await db.query(queryStr, [comercio_id]);
      console.log('Passed', tabla);
    }
    console.log('ALL PASSED');
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    process.exit(0);
  }
}
test();
