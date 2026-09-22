const fs = require('fs');
let html = fs.readFileSync('frontend/pages/productos.html', 'utf8');

const start = html.indexOf('id="modalImportarExcel"');
const end = html.indexOf('</div>', html.indexOf('btnProcesarExcel')) + 30;
console.log(html.substring(start - 20, end));
