const fs = require('fs');
let html = fs.readFileSync('frontend/pages/productos.html', 'utf8');

const start = html.indexOf('id="modalProducto"');
const end = html.indexOf('</form>', start);
console.log(html.substring(start - 20, end + 20));
