const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// Update the form style to flex: 1 and min-height: 0
html = html.replace(
  '<form id="formDevolucion" style="display: flex; flex-direction: column; gap: 10px;">',
  '<form id="formDevolucion" style="display: flex; flex-direction: column; gap: 10px; flex: 1; min-height: 0;">'
);

// Update the tabla-container style
html = html.replace(
  '<div class="app-tabla-container" style="max-height: 400px; min-height: 0; margin-top: 10px;">',
  '<div class="app-tabla-container" style="flex: 1; min-height: 0; margin-top: 10px; overflow-y: auto;">'
);

// Update the app-resumen footer style so it doesn't need sticky because it's naturally at the bottom
// And remove position: sticky because it's already flex-packed to the bottom
html = html.replace(
  '<div class="app-resumen" style="display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: -20px; background: white; padding: 15px 0 0 0; margin-top: 15px; border-top: 1px solid #e2e8f0; z-index: 10;">',
  '<div class="app-resumen" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px 0 0 0; margin-top: 10px; border-top: 1px solid #e2e8f0; flex-shrink: 0;">'
);

// Also I'll make sure there's no typo
// check if app-modal-content for Devolucion has height: auto instead of height: 90vh?
// The user says "el carrito ... no genera scroll, se rompe, se va por atrs de los botones". This implies the sticky was overlapping the overflowing content!
// By changing to a strict flexbox layout (flex: 1 on the table, flex-shrink: 0 on the footer), it perfectly constrains everything.

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Flex layout strictly configured for modalDevolucion');
