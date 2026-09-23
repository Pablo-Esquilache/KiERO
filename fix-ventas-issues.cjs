const fs = require('fs');

// 1. JS Logic for ventas.js
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// Fix toggle buttons
js = js.replace(
  /btnToggleVista\.addEventListener\("click", \(\) => \{[\s\S]*?\}\);/g,
  `btnToggleVista.addEventListener("click", () => {
    const pos = document.getElementById("pos-container");
    const hist = document.getElementById("history-container");
    pos.style.display = "none";
    hist.style.display = "block";
    if(typeof cargarVentas === "function") cargarVentas();
    
    // Configurar la fecha en el filtro historial
    const fHist = document.getElementById("filtroFechaHistorial");
    if(fHist && !fHist.value) {
      fHist.value = new Date().toLocaleDateString("sv-SE");
    }
  });`
);

const historyLogic = `
// ==========================================
// FIX HISTORIAL DE VENTAS LOGIC
// ==========================================
const btnVolverVentas = document.getElementById("btnVolverVentas");
if(btnVolverVentas) {
  btnVolverVentas.addEventListener("click", () => {
    document.getElementById("pos-container").style.display = "grid";
    document.getElementById("history-container").style.display = "none";
  });
}

const filtroFechaHistorial = document.getElementById("filtroFechaHistorial");
if(filtroFechaHistorial) {
  filtroFechaHistorial.addEventListener("change", () => {
    if(!filtroFechaHistorial.value) {
      // mostrar todo
      ventasCachePrincipal = ventasCacheModal;
      renderVentasPrincipal(ventasCachePrincipal);
      return;
    }
    const seleccion = filtroFechaHistorial.value; // YYYY-MM-DD
    const filtradas = ventasCacheModal.filter((v) => {
      if(!v.fecha) return false;
      return v.fecha.startsWith(seleccion);
    });
    ventasCachePrincipal = filtradas;
    renderVentasPrincipal(filtradas);
  });
}
`;

if (!js.includes('FIX HISTORIAL DE VENTAS LOGIC')) {
  js += '\n' + historyLogic;
}

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed History logic in JS');


// 2. Client modal fix in HTML
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// The rapid modal I injected:
const rapidModal = /<!-- MODAL CREAR CLIENTE RAPIDO -->[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;

const fullModalHtml = `
    <!-- MODAL CREAR CLIENTE COMPLETO -->
    <div id="modalClienteRapido" class="app-modal" style="z-index: 15000;">
      <div class="app-modal-content" style="max-width: 600px; padding: 20px;">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Nuevo Cliente</h2>
          <button type="button" class="app-close" id="cerrarModalClienteRapido">Cerrar</button>
        </div>
        <form id="formClienteRapido" style="display: flex; flex-direction: column; gap: 15px;">
          <div style="display: flex; gap: 10px;">
            <div class="app-form-group" style="margin-bottom:0; flex: 1;">
              <label>Nombre</label>
              <input type="text" id="nombreClienteRapido" class="app-input" required autocomplete="off">
            </div>
            <div class="app-form-group" style="margin-bottom:0; flex: 1;">
              <label>Documento/CUIT</label>
              <input type="text" id="docClienteRapido" class="app-input" autocomplete="off">
            </div>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <div class="app-form-group" style="margin-bottom:0; flex: 1;">
              <label>Teléfono</label>
              <input type="text" id="telClienteRapido" class="app-input" autocomplete="off">
            </div>
            <div class="app-form-group" style="margin-bottom:0; flex: 1;">
              <label>Email</label>
              <input type="email" id="emailClienteRapido" class="app-input" autocomplete="off">
            </div>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <div class="app-form-group" style="margin-bottom:0; flex: 1;">
              <label>Domicilio</label>
              <input type="text" id="domClienteRapido" class="app-input" autocomplete="off">
            </div>
            <div class="app-form-group" style="margin-bottom:0; flex: 1;">
              <label>Género</label>
              <select id="generoClienteRapido" class="app-input">
                <option value="">Seleccionar</option>
                <option value="Femenino">Femenino</option>
                <option value="Masculino">Masculino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          
          <div class="app-form-group" style="margin-bottom:0;">
            <label>Comentarios</label>
            <input type="text" id="comentariosClienteRapido" class="app-input" autocomplete="off">
          </div>
          
          <button type="submit" class="app-btn-primary" id="btnGuardarClienteRapido" style="margin-top: 10px;">Guardar Cliente</button>
        </form>
      </div>
    </div>
`;

if (html.match(rapidModal)) {
  html = html.replace(rapidModal, fullModalHtml);
}

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Injected full client modal in HTML');


// 3. Update JS to handle new fields for client
let js2 = fs.readFileSync('frontend/js/ventas.js', 'utf8');
const oldClientPayload = /const p = \{\s*comercio_id: comercioId,\s*nombre: document.getElementById\("nombreClienteRapido"\).value.trim\(\),\s*documento: document.getElementById\("docClienteRapido"\).value.trim\(\)\s*\};/;

const newClientPayload = `const p = {
        comercio_id: comercioId,
        nombre: document.getElementById("nombreClienteRapido").value.trim(),
        documento: document.getElementById("docClienteRapido").value.trim(),
        telefono: document.getElementById("telClienteRapido").value.trim(),
        email: document.getElementById("emailClienteRapido").value.trim(),
        domicilio: document.getElementById("domClienteRapido").value.trim(),
        genero: document.getElementById("generoClienteRapido").value,
        comentarios: document.getElementById("comentariosClienteRapido").value.trim()
      };`;

if (js2.match(oldClientPayload)) {
  js2 = js2.replace(oldClientPayload, newClientPayload);
  fs.writeFileSync('frontend/js/ventas.js', js2);
  console.log('Updated client payload in JS');
}

