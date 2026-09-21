const fs = require('fs');
const html = fs.readFileSync('frontend/pages/productos.html', 'utf8');
const start = html.indexOf('id="nombreProducto"');
console.log(html.substring(start - 200, start + 1200));
