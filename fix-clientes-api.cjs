const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

// 1. Add DevolucionesAPI to imports
js = js.replace('import { ComercioAPI, ClientesAPI, HistorialAPI, VentasAPI } from "./api.js";', 
                'import { ComercioAPI, ClientesAPI, HistorialAPI, VentasAPI, DevolucionesAPI } from "./api.js";');

// 2. Fix the fetch in verHistorial
js = js.replace('const allDevoluciones = await fetch(`/api/devoluciones?comercio_id=${comercioId}`).then(r=>r.json());',
                'const allDevoluciones = await DevolucionesAPI.getAll(comercioId);');

// 3. Fix the fetch in ccRegistrarPago
js = js.replace(/await fetch\(\`\/api\/clientes\/\$\{clienteActualHistorial\}\/pago\`[\s\S]*?\}\);/m,
                `await ClientesAPI.registrarPago(clienteActualHistorial, { comercio_id: comercioId, monto });`);

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Fixed API calls in clientes.js');
