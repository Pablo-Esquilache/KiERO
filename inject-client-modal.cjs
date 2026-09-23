const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const modalClienteHtml = `
    <!-- MODAL CREAR CLIENTE RAPIDO -->
    <div id="modalClienteRapido" class="app-modal" style="z-index: 15000;">
      <div class="app-modal-content" style="max-width: 400px; padding: 20px;">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Crear Cliente</h2>
          <button type="button" class="app-close" id="cerrarModalClienteRapido">Cerrar</button>
        </div>
        <form id="formClienteRapido" style="display: flex; flex-direction: column; gap: 15px;">
          <div class="app-form-group" style="margin-bottom:0;">
            <label>Nombre</label>
            <input type="text" id="nombreClienteRapido" class="app-input" required autocomplete="off">
          </div>
          <div class="app-form-group" style="margin-bottom:0;">
            <label>Documento/CUIT</label>
            <input type="text" id="docClienteRapido" class="app-input" autocomplete="off">
          </div>
          <button type="submit" class="app-btn-primary" id="btnGuardarClienteRapido">Guardar Cliente</button>
        </form>
      </div>
    </div>
    <!-- SCRIPTS -->`;

if (!html.includes('modalClienteRapido')) {
  html = html.replace('<!-- SCRIPTS -->', modalClienteHtml);
  fs.writeFileSync('frontend/pages/ventas.html', html);
  console.log('Injected modalClienteRapido in HTML');
}
