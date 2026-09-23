const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

html = html.replace(/<div class="app-tabla-container" style="max-height: 250px; min-height: 0; margin-top: 15px;">/g, '<div class="app-tabla-container" style="max-height: 350px; min-height: 0; margin-top: 15px;">');

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Increased table max-height');
