const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// Replace the specific app-form-group divs in formDevolucion to have flex: none
// 1. Cliente
html = html.replace(
  /<div class="app-form-group" style="margin-bottom: 0;">\s*<label>Cliente/g,
  '<div class="app-form-group" style="margin-bottom: 0; flex: none;">\n              <label>Cliente'
);

// 2. Producto
html = html.replace(
  /<div class="app-form-group" style="margin-bottom: 0;">\s*<label>Producto/g,
  '<div class="app-form-group" style="margin-bottom: 0; flex: none;">\n              <label>Producto'
);

html = html.replace(
  /<div style="display: flex; gap: 10px;">/,
  '<div style="display: flex; gap: 10px; flex: none;">'
);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed flex:1 override with Regex');
