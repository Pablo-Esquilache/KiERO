const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// 1. Remove max-height constraint from the table container in this modal so it actually fills the whole middle space
html = html.replace(
  '<div class="app-tabla-container" style="flex: 1; min-height: 0; margin-top: 10px; overflow-y: auto;">',
  '<div class="app-tabla-container" style="flex: 1; min-height: 0; margin-top: 10px; overflow-y: auto; max-height: none;">'
);

// 2. Ensure footer stays at the very bottom just in case
html = html.replace(
  '<div class="app-resumen" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 0 0 0; margin-top: 10px; border-top: 1px solid #e2e8f0; flex-shrink: 0;">',
  '<div class="app-resumen" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 0 0 0; margin-top: auto; border-top: 1px solid #e2e8f0; flex-shrink: 0;">'
);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed CSS flex stretch');
