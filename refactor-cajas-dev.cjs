const fs = require('fs');
let code = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

const regexDev = /SELECT d\.id, d\.fecha, d\.total, v\.metodo_pago\s*FROM devoluciones d\s*LEFT JOIN ventas v ON v\.id = d\.venta_id/m;
code = code.replace(regexDev, 'SELECT d.id, d.fecha, d.total, COALESCE(d.metodo_pago, v.metodo_pago) as metodo_pago FROM devoluciones d LEFT JOIN ventas v ON v.id = d.venta_id');

fs.writeFileSync('backend/controllers/cajasController.js', code);
console.log('Fixed cajasController');
