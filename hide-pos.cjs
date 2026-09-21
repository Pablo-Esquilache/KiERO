const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

html = html.replace(
  '<div class="pos-header"><h1 class="app-title">Punto de Venta</h1></div>',
  '<div class="pos-header" style="display: none;"><h1 class="app-title">Punto de Venta</h1></div>'
);

html = html.replace(
  '<div id="pos-container" class="pos-layout">',
  '<div id="pos-container" class="pos-layout" style="display: none;">'
);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log("ventas.html updated");
