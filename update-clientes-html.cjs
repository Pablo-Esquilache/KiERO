const fs = require('fs');

let html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');

// Use regex to strip existing modals to rewrite them cleanly
html = html.replace(/<div id="app-modal-detalle"[\s\S]*?(?=<!-- MODAL HISTORIAL -->|<div id="app-modal-historial"|<script|$)/g, '');
html = html.replace(/<div id="app-modal-historial"[\s\S]*?(?=<!-- CUENTA CORRIENTE -->|<div id="app-modal-cc"|<script|$)/g, '');
html = html.replace(/<div id="app-modal-cc"[\s\S]*?(?=<script|$)/g, '');
html = html.replace(/<!-- MODAL DETALLE VENTA \(Formato Ticket\) -->/g, '');
html = html.replace(/<!-- MODAL HISTORIAL -->/g, '');
html = html.replace(/<!-- CUENTA CORRIENTE -->/g, '');

const newModals = `
    <!-- MODAL HISTORIAL (Z-INDEX 1000) -->
    <div id="app-modal-historial" class="app-modal" style="z-index: 1000;">
      <div class="app-modal-content" style="max-width: 900px;">
        <div class="app-modal-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2 class="app-subtitle" style="margin:0;">Historial de Cliente</h2>
          <div style="display: flex; gap: 10px;">
            <button type="button" class="app-btn-primary" id="btnDescargarResumen">Descargar Resumen</button>
            <button type="button" class="app-btn-secondary" id="btnRegistrarPagoHistorial" style="background-color: #e53935; color: white;">Registrar Pago</button>
            <button type="button" class="app-close-historial app-close">Cerrar</button>
          </div>
        </div>

        <div style="max-height: 400px; overflow-y: auto; margin-top: 15px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <table class="app-tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Operación</th>
                <th>Método</th>
                <th>Total</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody id="tablaHistorialBody">
              <!-- JS Inyecta ventas y devoluciones acá -->
            </tbody>
          </table>
        </div>

        <div id="resumenHistorial" class="caja-grid" style="margin-top: 20px; display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px;">
          <!-- Tarjetas (Efectivo, Digital, Devoluciones, Total, CC) -->
        </div>
      </div>
    </div>

    <!-- MODAL REGISTRAR PAGO (Z-INDEX 1050) -->
    <div id="app-modal-pago" class="app-modal" style="z-index: 1050; display: none;">
      <div class="app-modal-content" style="max-width: 400px;">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Registrar Pago de Deuda</h2>
          <button type="button" class="app-close" id="btnCerrarModalPago">Cerrar</button>
        </div>
        <div class="app-form-group" style="margin-top: 20px;">
          <label>Monto a Pagar</label>
          <input type="number" id="ccMontoPago" class="app-input" placeholder="Ej: 5000" />
        </div>
        <button type="button" id="ccRegistrarPago" class="app-btn-primary" style="width: 100%; margin-top: 15px; font-size: 1.1em; padding: 12px;">CONFIRMAR PAGO</button>
      </div>
    </div>

    <!-- MODAL DETALLE VENTA / TICKET (Z-INDEX 1100) -->
    <div id="app-modal-detalle" class="app-modal" style="z-index: 1100; display: none;">
      <div class="app-modal-content app-modal-ticket">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Ticket</h2>
          <button type="button" class="app-close-detalle app-close">Cerrar</button>
        </div>
        <div class="app-ticket-body">
          <div class="v-ticket-info">
            <p><strong>ID:</strong> <span id="ticketIdDetalle"></span></p>
            <p><strong>Fecha:</strong> <span id="ticketFechaDetalle"></span></p>
            <p><strong>Método:</strong> <span id="ticketMetodoDetalle"></span></p>
          </div>
          <div class="app-ticket-tabla-container">
            <table class="app-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cant.</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody id="tablaDetalleBody"></tbody>
            </table>
          </div>
          <div class="app-ticket-total">
            Total: $<span id="detalleTotal"></span>
          </div>
        </div>
      </div>
    </div>
`;

// Inject before <script type="module" src="../js/clientes.js"></script>
html = html.replace(/<script type="module" src="\.\.\/js\/clientes\.js"><\/script>/, newModals + '\n    <script type="module" src="../js/clientes.js"></script>');

fs.writeFileSync('frontend/pages/clientes.html', html);
console.log('clientes.html updated successfully');
