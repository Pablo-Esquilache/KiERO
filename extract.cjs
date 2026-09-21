const fs = require('fs');
const html = fs.readFileSync('frontend/pages/caja.html', 'utf8');
const start = html.indexOf('<div id="bloqueResumen"');
const end = html.indexOf('<!-- Botón cerrar caja -->', start);
console.log(html.substring(start, end));
