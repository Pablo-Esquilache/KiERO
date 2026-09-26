const fs = require('fs');
let c = fs.readFileSync('backend/controllers/clientesController.js', 'utf8');

// For pagos, we don't even receive fecha in the frontend! We just use CURRENT_TIMESTAMP anyway.
c = c.replace(/INSERT INTO cuenta_corriente_movimientos\n\s*\(cliente_id, comercio_id, tipo, monto\)\n\s*VALUES \(\$1, \$2, 'pago', \$3\)/g, 
  "INSERT INTO cuenta_corriente_movimientos\n        (cliente_id, comercio_id, tipo, monto, created_at)\n        VALUES ($1, $2, 'pago', $3, CURRENT_TIMESTAMP)");

fs.writeFileSync('backend/controllers/clientesController.js', c);
