const fs = require('fs');
let c = fs.readFileSync('backend/controllers/clientesController.js', 'utf8');
c = c.replace(/INSERT INTO cuenta_corriente_movimientos\s*\([^)]*\)\s*VALUES\s*\([^)]*\)\s*RETURNING \*/, 
  "INSERT INTO cuenta_corriente_movimientos\n        (cliente_id, comercio_id, tipo, monto)\n        VALUES ($1, $2, 'pago', $3)\n        RETURNING *");
c = c.replace(/\[id,\s*monto\]/, "[id, comercio_id, monto]");
fs.writeFileSync('backend/controllers/clientesController.js', c);
