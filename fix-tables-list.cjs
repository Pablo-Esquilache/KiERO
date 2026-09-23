const fs = require('fs');
let js = fs.readFileSync('backend/controllers/exportarController.js', 'utf8');

js = js.replace(
    'const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cajas_movimientos"];',
    'const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cuenta_corriente_movimientos", "turnos", "configuracion_sync", "usuarios"];'
);

js = js.replace(
    "} else if (tabla === 'cajas_movimientos') {",
    "} else if (tabla === 'cuenta_corriente_movimientos') {"
);

js = js.replace(
    "queryStr = `SELECT cm.* FROM cajas_movimientos cm JOIN cajas c ON c.id = cm.caja_id WHERE c.comercio_id = $1`;",
    "queryStr = `SELECT ccm.* FROM cuenta_corriente_movimientos ccm JOIN clientes c ON c.id = ccm.cliente_id WHERE c.comercio_id = $1`;"
);

// We need to also filter usuarios and configuracion_sync, and turnos
// turnos has comercio_id
// configuracion_sync has comercio_id
// usuarios has comercio_id? Let's check authController
// "SELECT * FROM usuarios WHERE usuario = $1"
// Actually we can skip usuarios and configuracion_sync, as they are not core transactional data, but let's see.
// If query throws an error, the whole backup crashes. 

fs.writeFileSync('backend/controllers/exportarController.js', js);
console.log('Fixed tables list');
