const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// 1. Restore pos-left header to normal (btnToggleVista)
const oldPosLeftTop = /<div class="pos-info-box">\s*<label>Fecha de hoy<\/label>\s*<input type="date" id="fechaVenta" class="app-input" required readonly \/>[\s\S]*?<\/div>\s*<\/div>/;
const newPosLeftTop = `<div class="pos-info-box">
                <label>Fecha de hoy</label>
                <input type="date" id="fechaVenta" class="app-input" required readonly />
                <button type="button" id="btnToggleVista" class="app-btn-secondary" style="width: 100%; margin-top: 15px;">Historial de Ventas</button>
              </div>`;
html = html.replace(oldPosLeftTop, newPosLeftTop);

// 2. Add buttons at the bottom of pos-left
const oldPosLeftBottom = /<button type="button" id="btnCrearClienteRapido" class="app-btn-primary" style="flex: 1; padding: 10px; margin: 0;" title="Crear nuevo cliente">\+ Nuevo<\/button>\s*<\/div>\s*<\/div>\s*<!-- MIDDLE: Product Search -->/;

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

            <!-- MIDDLE: Product Search -->`;

html = html.replace(oldPosLeftBottom, newPosLeftBottom);

// 3. Remove from history-container
const oldDevControls = /<div>\s*<button id="btnDevolucion" class="btn-secundario">Devolución<\/button>\s*<button id="btnVerDevoluciones" class="app-btn-secondary">\s*Ver devoluciones\s*<\/button>\s*<\/div>/;
html = html.replace(oldDevControls, '');


// 4. Update the name of btnToggleVista logic in JS (it toggles to "Volver a Punto de Venta" today, let's keep it as is or change it). The user said: "el botón que va al historial tiene que decir Ir al historial de ventas, no Volver al punto de venta como dice." So we need to fix ventas.js toggle logic.
fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed ventas.html layout');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// A. Fix variable names in Autocomplete logic
const oldCliAuto = /const filtrados = clientes\.filter/g;
const newCliAuto = 'const filtrados = allClientes.filter';
js = js.replace(oldCliAuto, newCliAuto);

const oldProdAuto = /const filtrados = productos\.filter/g;
const newProdAuto = 'const filtrados = productosCache.filter';
js = js.replace(oldProdAuto, newProdAuto);

const oldProdFind = /const prodObj = productos\.find/g;
const newProdFind = 'const prodObj = productosCache.find';
js = js.replace(oldProdFind, newProdFind);


// B. Fix toggle text in ventas.js
const oldToggleText1 = /btnToggleVista\.textContent = "Ver Historial del Día";/g;
const newToggleText1 = 'btnToggleVista.textContent = "Historial de Ventas";';
js = js.replace(oldToggleText1, newToggleText1);

const oldToggleText2 = /btnToggleVista\.textContent = "Volver a Punto de Venta";/g;
const newToggleText2 = 'btnToggleVista.textContent = "Volver a Punto de Venta";'; // user didn't like this? "no Volver al Punto de Venta como dice". Maybe they meant when they are IN the POS it was saying Volver al punto de venta? Wait, if I'm in POS, it goes to history. Let's just set it correctly.
// Actually, I'll change it to:
const newToggleLogic = `        if(posContainer.style.display === "none") {
          posContainer.style.display = "grid";
          historyContainer.style.display = "none";
          btnToggleVista.textContent = "Ir al Historial de Ventas";
          title.textContent = "Punto de Venta";
        } else {
          posContainer.style.display = "none";
          historyContainer.style.display = "block";
          btnToggleVista.textContent = "Ir a Punto de Venta";
          title.textContent = "Historial de Ventas";
        }`;
const oldToggleLogic = /if\(posContainer\.style\.display === "none"\) \{[\s\S]*?title\.textContent = "Historial de Ventas";\s*\}/;
js = js.replace(oldToggleLogic, newToggleLogic);


// C. Bind btnVerDevolucionesLeft to open modalVerDevoluciones
// Since we removed btnVerDevoluciones from HTML, we need to add the listener to btnVerDevolucionesLeft
const oldVerDevListener = /btnVerDevoluciones\?\.addEventListener\("click", async \(\) => \{/g;
const newVerDevListener = `const btnVerDevolucionesLeft = document.getElementById("btnVerDevolucionesLeft");
btnVerDevolucionesLeft?.addEventListener("click", async () => {`;
js = js.replace(oldVerDevListener, newVerDevListener);


fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed ventas.js references');
