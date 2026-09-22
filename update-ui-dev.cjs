const fs = require('fs');

// ===============================================
// 1. UPDATE VENTAS.HTML
// ===============================================
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// A. Move buttons to left panel bottom
const oldBtnToggleVista = /<button type="button" id="btnToggleVista" class="app-btn-secondary" style="width: 100%; margin-top: 15px;">Ver Historial del Día<\/button>/;
const newButtonsLeft = `
                <div style="display: flex; gap: 8px; margin-top: 15px;">
                  <button type="button" id="btnToggleVista" class="app-btn-secondary" style="flex: 1; padding: 10px;">Ver Historial</button>
                  <button type="button" id="btnCrearDevolucionLeft" class="app-btn-primary" style="flex: 1; padding: 10px; background-color: #f59e0b; border: none;">Generar Devolución</button>
                </div>`;
html = html.replace(oldBtnToggleVista, newButtonsLeft);

// B. Remove old buttons from the History modal
const oldBtnHistoryGroup = /<button type="button" id="btnCrearDevolucion" class="app-btn-secondary">Devolución<\/button>\s*<button type="button" id="btnVerDevoluciones" class="app-btn-secondary">Ver Devoluciones<\/button>/;
html = html.replace(oldBtnHistoryGroup, '');

// C. Update the Devolucion modal
// The old modal has #clienteDevolucion (select), #barcodeDevolucion, #btnBuscarDevolucion, #cantidadDevolucion, #btnAgregarDevolucion
const oldModalDevolucionRegex = /<div id="modalDevolucion" class="app-modal">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;

const newModalDevolucion = `<div id="modalDevolucion" class="app-modal" style="z-index: 1000;">
      <div class="app-modal-content" style="max-width: 600px">
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
            <div style="position: relative; width: 100%;">
              <input type="text" id="clienteDevolucionNombre" class="app-input" style="width: 100%;" placeholder="Buscar cliente..." autocomplete="off">
              <ul id="autocompleteClientesDevolucion" class="app-autocomplete-list" style="display:none; width: 100%;"></ul>
            </div>
          </div>

          <div class="app-form-group" style="display: flex; gap: 8px;">
            <div style="flex: 3; position: relative;">
              <label>Producto a devolver</label>
              <input type="hidden" id="productoDevolucion">
              <input type="text" id="productoDevolucionNombre" class="app-input" style="width: 100%; height: 38px;" placeholder="Buscar producto..." autocomplete="off">
              <ul id="autocompleteProductosDevolucion" class="app-autocomplete-list" style="display:none; width: 100%;"></ul>
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

          <div class="app-tabla-container" style="max-height: 200px; min-height: 0; margin-top: 15px;">
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

html = html.replace(oldModalDevolucionRegex, newModalDevolucion);

// D. Clean up duplicated or obsolete modals if any, but replace is fine.

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Updated ventas.html for devoluciones libres');

// ===============================================
// 2. UPDATE VENTAS.JS
// ===============================================
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// I will write a companion script to handle the complex JS replacements.
