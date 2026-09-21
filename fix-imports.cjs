const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');
js = js.replace('DevolucionesAPI,\\n  CajasAPI,', 'DevolucionesAPI,\n  CajasAPI,');
fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed');
