const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

js = js.replace('getElementById("btnDescargarHistorial")', 'getElementById("btnDescargarResumen")');

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Fixed button ID mismatch');
