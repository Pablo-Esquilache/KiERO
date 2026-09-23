const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const regexModal = /<div id="modalTicket" class="app-modal">[\s\S]*?<!-- ========================= -->\s*<!-- MODAL BUSCAR PRODUCTO -->/g;

const newModalHtml = `<!-- ====================================================== -->
    <!-- MODAL TICKET (HISTORIAL) -->
    <!-- ====================================================== -->
    <div id="modalTicket" class="app-modal" style="z-index: 11000;">
      <div class="app-modal-content" style="max-width: 400px; padding: 0;">
        <div style="padding: 15px; border-bottom: 1px dashed #ccc; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 1.2rem; color: #1e293b;">Detalle de Venta</h2>
          <button type="button" id="btnImprimirTicketHistorial" class="app-btn-secondary" style="padding: 5px 10px; font-size: 0.9em;">🖨️ Imprimir</button>
        </div>
        
        <div id="ticketHistorialContenido" style="padding: 20px; max-height: 50vh; overflow-y: auto; font-family: monospace; font-size: 14px;">
          <!-- JS Inyecta el texto aqui -->
        </div>

        <div style="padding: 15px; text-align: center; border-top: 1px dashed #ccc; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <button type="button" id="cerrarModalTicket" class="app-btn-primary" style="width: 100%; padding: 12px; font-size: 1.1em; background-color: #64748b; border: none;">Cerrar Ticket</button>
        </div>
      </div>
    </div>
    
    <!-- ========================= -->
    <!-- MODAL BUSCAR PRODUCTO -->`;

if (html.match(regexModal)) {
  html = html.replace(regexModal, newModalHtml);
  fs.writeFileSync('frontend/pages/ventas.html', html);
  console.log("Updated HTML for modalTicket");
} else {
  console.log("Could not match modalTicket in HTML");
}
