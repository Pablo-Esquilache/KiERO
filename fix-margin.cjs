const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// Ensure margin-bottom is consistent
html = html.replace('<div class="app-form-group">', '<div class="app-form-group" style="margin-bottom: 20px;">');
html = html.replace('<div class="app-form-group" style="display: flex; gap: 8px;">', '<div class="app-form-group" style="display: flex; gap: 15px; margin-bottom: 20px;">');

// Increase flex gap from 8px to 15px for the product row so Cantidad and Product inputs aren't too squished
fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed margins between Cliente and Producto');
