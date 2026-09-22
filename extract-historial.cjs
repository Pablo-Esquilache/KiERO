const fs = require('fs');
const js = fs.readFileSync('frontend/js/clientes.js', 'utf8');
const start = js.indexOf('async function verHistorial(clienteId)');
const end = js.indexOf('}', js.indexOf('modalHistorial.style.display = "flex";', start)) + 20;
console.log(js.substring(start, end));
