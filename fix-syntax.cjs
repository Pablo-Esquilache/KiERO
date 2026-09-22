const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const regex = /renderDevolucionesLazy\(false\);\n\}\);/g;
js = js.replace(regex, `renderDevolucionesLazy(false);\n}`);

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed syntax error');
