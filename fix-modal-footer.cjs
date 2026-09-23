const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// 1. Fix Cantidad and Agregar Button
const cantidadMatch = html.match(/<div class="app-form-group" style="margin-bottom: 0; flex: 1;">\s*<label>Cantidad<\/label>[\s\S]*?<div class="app-form-group" style="margin-bottom: 0; flex: 1; display: flex; align-items: flex-end;">[\s\S]*?<button[\s\S]*?Agregar\s*<\/button>\s*<\/div>/);

if (cantidadMatch) {
  const newCantidadHtml = `<div class="app-form-group" style="margin-bottom: 0; flex: 1;">
              <label>Cantidad</label>
              <input
                type="number"
                id="cantidadDevolucion"
                class="app-input"
                min="1"
                placeholder="Cant."
                style="height: 38px;"
              />
            </div>
            
            <div class="app-form-group" style="margin-bottom: 0; flex: 1; display: flex; flex-direction: column;">
              <label>&nbsp;</label>
              <button
                type="button"
                id="btnAgregarDevolucion"
                class="app-btn-secondary"
                style="height: 38px; width: 100%; padding: 0;"
              >
                Agregar
              </button>
            </div>`;
  html = html.replace(cantidadMatch[0], newCantidadHtml);
  console.log('Fixed Cantidad block');
} else {
  console.log('Cantidad block not found');
}

// 2. Fix app-resumen styles without breaking special chars
html = html.replace(
  '<div class="app-resumen" style="margin-top: 15px; text-align: right;">',
  '<div class="app-resumen" style="display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: -20px; background: white; padding: 15px 0 0 0; margin-top: 15px; border-top: 1px solid #e2e8f0; z-index: 10;">'
);

html = html.replace(
  '<div class="app-total-final" style="color: #f59e0b; font-size: 1.2rem; font-weight: bold;">',
  '<div class="app-total-final" style="color: #f59e0b; font-size: 1.2rem; font-weight: bold; margin: 0;">'
);

html = html.replace(
  'style="margin-top: 10px; background-color: #f59e0b; border: none; width: 100%;"',
  'style="background-color: #f59e0b; border: none; width: auto; padding: 10px 25px;"'
);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed sticky footer');
