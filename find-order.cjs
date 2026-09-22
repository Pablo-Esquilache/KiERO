const fs = require('fs');
const html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');
console.log('Historial:', html.indexOf('id="app-modal-historial"'));
console.log('Detalle:', html.indexOf('id="app-modal-detalle"'));
