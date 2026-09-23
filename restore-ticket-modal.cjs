const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const missingModal = `
    <!-- ========================= -->
    <!-- MODAL TICKET DEVOLUCION -->
    <!-- ========================= -->
    <div id="modalTicketDevolucion" class="app-modal" style="z-index: 10000;">
      <div class="app-modal-content app-modal-ticket" style="max-width: 400px;">
        <div class="app-modal-header">
          <h2 class="app-subtitle">Ticket Devoluci&oacute;n</h2>
          <button type="button" class="app-close" id="cerrarModalTicketDevolucion">Cerrar</button>
        </div>
        <div class="app-ticket-body">
          <div class="v-ticket-info">
            <p><strong>ID:</strong> <span id="ticketDevId"></span></p>
            <p><strong>Fecha:</strong> <span id="ticketDevFecha"></span></p>
            <p><strong>Cliente:</strong> <span id="ticketDevCliente"></span></p>
            <p><strong>Total:</strong> $<span id="ticketDevTotal"></span></p>
          </div>
          <div class="app-ticket-tabla-container" style="margin-top: 15px;">
            <table class="app-tabla" style="font-size: 0.9em;">
              <thead>
                <tr>
                  <th>Prod</th>
                  <th>Cant</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody id="ticketDevDetalleBody"></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
`;

if (!html.includes('id="modalTicketDevolucion"')) {
  html = html.replace('</body>', missingModal + '\n  </body>');
  fs.writeFileSync('frontend/pages/ventas.html', html);
  console.log('Restored modalTicketDevolucion');
} else {
  console.log('modalTicketDevolucion already exists');
}
