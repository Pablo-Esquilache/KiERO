const fs = require('fs');
const js = fs.readFileSync('frontend/js/clientes.js', 'utf8');
const start = js.indexOf('async function verDetalleVenta(ventaId)');
const end = js.indexOf('}', js.indexOf('modalDetalle.style.display = "flex";', start)) + 20;
console.log(js.substring(start, end));
