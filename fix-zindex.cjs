const fs = require('fs');
let html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');

html = html.replace(
    '<div id="app-modal-detalle" class="app-modal">',
    '<div id="app-modal-detalle" class="app-modal" style="z-index: 1050;">'
);

html = html.replace(
    '<div id="app-modal-cc" class="app-modal">',
    '<div id="app-modal-cc" class="app-modal" style="z-index: 1050;">'
);

fs.writeFileSync('frontend/pages/clientes.html', html);
console.log('Fixed modal z-indexes');
