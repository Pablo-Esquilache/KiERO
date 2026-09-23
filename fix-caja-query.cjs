const fs = require('fs');

let backendJS = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

backendJS = backendJS.replace(
  'COALESCE(d.metodo_pago, v.metodo_pago) as metodo_pago',
  "COALESCE(v.metodo_pago, 'Efectivo') as metodo_pago"
);

fs.writeFileSync('backend/controllers/cajasController.js', backendJS);
console.log('Fixed caja error');
