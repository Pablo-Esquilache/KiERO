const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

html = html.replace(
  '<form id="formDevolucion" class="app-form-venta">',
  '<form id="formDevolucion" class="app-form-venta" style="justify-content: flex-start; gap: 20px;">'
);

// We can safely remove the inline margin-bottom from the children since the parent handles the gap now
html = html.replace('<div class="app-form-group" style="margin-bottom: 20px;">', '<div class="app-form-group">');
html = html.replace('<div class="app-form-group" style="display: flex; gap: 15px; margin-bottom: 20px;">', '<div class="app-form-group" style="display: flex; gap: 15px;">');

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed flex spacing in Devolucion form');
