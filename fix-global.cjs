const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

js = js.replace(/renderProductosModal\(productosCache\);/g, 'window.renderProductosModal(productosCache);');
js = js.replace(/renderProductosModal\(filtrados\);/g, 'window.renderProductosModal(filtrados);');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed globally');
