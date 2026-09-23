const fs = require('fs');
let js = fs.readFileSync('backend/controllers/exportarController.js', 'utf8');

js = js.replace(
  'const { rows } = await db.query(`SELECT * FROM ${tabla} WHERE comercio_id = $1`, [comercio_id]);',
  `let queryStr = \`SELECT * FROM \${tabla} WHERE comercio_id = $1\`;
      
      // If table doesn't have comercio_id directly, join with parent
      if (tabla === 'ventas_detalle') {
        queryStr = \`SELECT vd.* FROM ventas_detalle vd JOIN ventas v ON v.id = vd.venta_id WHERE v.comercio_id = $1\`;
      } else if (tabla === 'devoluciones_detalle') {
        queryStr = \`SELECT dd.* FROM devoluciones_detalle dd JOIN devoluciones d ON d.id = dd.devolucion_id WHERE d.comercio_id = $1\`;
      } else if (tabla === 'cajas_movimientos') {
        queryStr = \`SELECT cm.* FROM cajas_movimientos cm JOIN cajas c ON c.id = cm.caja_id WHERE c.comercio_id = $1\`;
      }
      
      const { rows } = await db.query(queryStr, [comercio_id]);`
);

fs.writeFileSync('backend/controllers/exportarController.js', js);
console.log('Fixed export queries for child tables');
