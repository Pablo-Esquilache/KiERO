const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// 1. Remove "Devoluciones" title from pos-left bottom
const oldTitleDev = /<h4 style="margin: 0 0 10px 0; color: #b45309; text-align: center; font-size: 0.9em;">Devoluciones<\/h4>/;
html = html.replace(oldTitleDev, '');

// 2. Add lupitas to the modal and make it wider
const oldModalDevRegex = /<div id="modalDevolucion" class="app-modal" style="z-index: 1000;">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;

const newModalDev = `<div id="modalDevolucion" class="app-modal" style="z-index: 1000;">
      <div class="app-modal-content" style="max-width: 800px">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Generar Devolución</h2>
          <button type="button" class="app-close" id="cerrarModalDevolucion">
            Cerrar
          </button>
        </div>

        <form id="formDevolucion" class="app-form-venta">
          <div class="app-form-group">
            <label>Cliente (Opcional - Consumidor Final si se omite)</label>
            <input type="hidden" id="clienteDevolucion">
            <div style="display: flex; gap: 8px;">
              <div style="position: relative; flex: 1;">
                <input type="text" id="clienteDevolucionNombre" class="app-input" style="width: 100%; height: 38px;" placeholder="Buscar cliente..." autocomplete="off">
                <ul id="autocompleteClientesDevolucion" class="app-autocomplete-list" style="display:none; width: 100%;"></ul>
              </div>
              <button type="button" id="btnBuscarClienteDev" class="app-btn-secondary" style="padding: 0 15px; height: 38px;" title="Búsqueda Avanzada">🔍</button>
            </div>
          </div>

          <div class="app-form-group" style="display: flex; gap: 8px;">
            <div style="flex: 3;">
              <label>Producto a devolver</label>
              <div style="display: flex; gap: 8px;">
                <div style="position: relative; flex: 1;">
                  <input type="hidden" id="productoDevolucion">
                  <input type="text" id="productoDevolucionNombre" class="app-input" style="width: 100%; height: 38px;" placeholder="Buscar producto..." autocomplete="off">
                  <ul id="autocompleteProductosDevolucion" class="app-autocomplete-list" style="display:none; width: 100%;"></ul>
                </div>
                <button type="button" id="btnBuscarProductoDev" class="app-btn-secondary" style="padding: 0 15px; height: 38px;" title="Búsqueda Avanzada">🔍</button>
              </div>
            </div>
            
            <div style="flex: 1;">
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
            <div style="flex: 1; display: flex; align-items: flex-end;">
              <button
                type="button"
                id="btnAgregarDevolucion"
                class="app-btn-secondary"
                style="height: 38px; width: 100%; padding: 0;"
              >
                Agregar
              </button>
            </div>
          </div>

          <div class="app-form-group">
            <label>Método de reintegro (Si aplica)</label>
            <select id="metodoPagoDevolucion" class="app-input">
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta de Débito">Tarjeta de Débito</option>
              <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cuenta Corriente">Cuenta Corriente (Abonar a cuenta)</option>
            </select>
          </div>

          <div class="app-tabla-container" style="max-height: 250px; min-height: 0; margin-top: 15px;">
            <table class="app-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="carritoDevolucionBody"></tbody>
            </table>
          </div>

          <div class="app-resumen" style="margin-top: 15px; text-align: right;">
            <div class="app-total-final" style="color: #f59e0b; font-size: 1.2rem; font-weight: bold;">
              Total: $<span id="totalDevolucion">0.00</span>
            </div>
            <button
              type="submit"
              class="app-btn-primary"
              style="margin-top: 10px; background-color: #f59e0b; border: none; width: 100%;"
            >
              Confirmar Devolución
            </button>
          </div>
        </form>
      </div>
    </div>`;

html = html.replace(oldModalDevRegex, newModalDev);

// 3. Re-inject modalVerDevoluciones
if (!html.includes('id="modalVerDevoluciones"')) {
  const missingModal = `<!-- ========================= -->
    <!-- MODAL VER DEVOLUCIONES -->
    <!-- ========================= -->
    <div id="modalVerDevoluciones" class="app-modal" style="z-index: 1000;">
      <div class="app-modal-content" style="max-width: 800px">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Historial de Devoluciones del Día</h2>
          <button
            type="button"
            class="app-close"
            id="cerrarModalVerDevoluciones"
          >
            Cerrar
          </button>
        </div>
        <div class="app-tabla-container">
          <table class="app-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="tablaDevolucionesBody"></tbody>
          </table>
        </div>
      </div>
    </div>\n\n`;
  html = html.replace('<!-- MODAL BUSCAR CLIENTE -->', missingModal + '<!-- MODAL BUSCAR CLIENTE -->');
}

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed ventas.html (Modal Dev Wider, Lupitas added, modalVerDevoluciones restored)');
