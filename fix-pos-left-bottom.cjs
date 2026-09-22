const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const oldPosLeftBottom = /<button type="button" id="btnCrearClienteRapido" class="app-btn-primary" style="flex: 1; padding: 10px; margin: 0;" title="Crear nuevo cliente">\+ Nuevo<\/button>\s*<\/div>\s*<\/div>\s*<\/div>\s*<!-- RIGHT COLUMN \(80%\) -->/m;

const newPosLeftBottom = `<button type="button" id="btnCrearClienteRapido" class="app-btn-primary" style="flex: 1; padding: 10px; margin: 0;" title="Crear nuevo cliente">+ Nuevo</button>
                </div>
              </div>

              <!-- BOTONES DEVOLUCION AL PISO -->
              <div class="pos-info-box" style="margin-top: auto; border: 1px dashed #f59e0b; background: #fffbeb;">
                <h4 style="margin: 0 0 10px 0; color: #b45309; text-align: center; font-size: 0.9em;">Devoluciones</h4>
                <div style="display: flex; gap: 8px; flex-direction: column;">
                  <button type="button" id="btnCrearDevolucionLeft" class="app-btn-primary" style="padding: 10px; background-color: #f59e0b; border: none; font-weight: bold;">Generar Devolución</button>
                  <button type="button" id="btnVerDevolucionesLeft" class="app-btn-secondary" style="padding: 10px; color: #b45309; border-color: #fcd34d;">Historial de Devolución</button>
                </div>
              </div>
            </div>

            <!-- RIGHT COLUMN (80%) -->`;

html = html.replace(oldPosLeftBottom, newPosLeftBottom);
fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed pos-left bottom');
