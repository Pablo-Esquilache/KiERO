const fs = require('fs');

let js = fs.readFileSync('backend/controllers/exportarController.js', 'utf8');

js = js.replace(
  'const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cuenta_corriente_movimientos", "turnos", "configuracion_sync", "usuarios"];',
  'const tablas = ["clientes", "productos", "gastos", "ventas", "ventas_detalle", "devoluciones", "devoluciones_detalle", "cajas", "cuenta_corriente_movimientos", "turnos", "configuracion_sync"];'
);

fs.writeFileSync('backend/controllers/exportarController.js', js);
console.log("Removed usuarios from backup");
