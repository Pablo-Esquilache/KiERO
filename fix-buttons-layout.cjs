const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const regexBottom = /<div class="pos-info-box" style="margin-top: auto; border: 1px dashed #f59e0b; background: #fffbeb;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<!-- RIGHT COLUMN \(80%\) -->/m;

const newBottom = `<div class="pos-info-box" style="margin-top: auto; border: 1px dashed #f59e0b; background: #fffbeb; padding: 10px;">
                <div style="display: flex; gap: 8px; flex-direction: row;">
                  <button type="button" id="btnVerDevolucionesLeft" class="app-btn-secondary" style="flex: 1; padding: 10px; color: #b45309; border-color: #fcd34d; font-size: 0.9em;">Historial de Devolución</button>
                  <button type="button" id="btnCrearDevolucionLeft" class="app-btn-primary" style="flex: 1; padding: 10px; background-color: #f59e0b; border: none; font-weight: bold; font-size: 0.9em;">Generar Devolución</button>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN (80%) -->`;

html = html.replace(regexBottom, newBottom);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed buttons layout');
