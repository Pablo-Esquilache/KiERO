const fs = require('fs');
let html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');

// The current modal-detalle body is:
const currentDetalle = `<div class="app-ticket-body">
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
        </div>`;

const newDetalle = `<div id="ticketExitoContenido" style="padding: 20px; max-height: 50vh; overflow-y: auto; font-family: monospace; font-size: 14px;">
          <div style="margin-bottom: 5px;"><strong>ID Venta:</strong> <span id="ticketIdDetalle"></span></div>
          <div style="margin-bottom: 5px;"><strong>Fecha:</strong> <span id="ticketFechaDetalle"></span></div>
          <div style="margin-bottom: 5px;"><strong>Método de pago:</strong> <span id="ticketMetodoDetalle"></span></div>
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          <div id="tablaDetalleBody">
            <!-- Items injected by JS -->
          </div>
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">
            Total: $<span id="detalleTotal"></span>
          </div>
        </div>`;

html = html.replace(currentDetalle, newDetalle);
fs.writeFileSync('frontend/pages/clientes.html', html);
console.log('Updated detalle modal html');

let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

const jsTableRender = `        data.forEach((item) => {
          total += Number(item.subtotal);
  
          tablaDetalleBody.innerHTML += \`
            <tr>
              <td>\${item.producto_nombre || "-"}</td>
              <td>\${item.cantidad}</td>
              <td>$\${Number(item.precio_unitario).toFixed(2)}</td>
              <td>$\${Number(item.subtotal).toFixed(2)}</td>
            </tr>
          \`;
        });`;

const jsTicketRender = `        data.forEach((item) => {
          total += Number(item.subtotal);
          tablaDetalleBody.innerHTML += \`<div style="display:flex; justify-content:space-between;"><span>\${item.cantidad}x \${item.producto_nombre || "-"}</span><span>\${Number(item.subtotal).toFixed(2)}</span></div>\`;
        });`;

if (js.includes('<td>${item.producto_nombre || "-"}</td>')) {
  // It's still using the table render format from the original code
  js = js.replace(jsTableRender, jsTicketRender);
  // Also fix the "Sin detalle disponible" text
  js = js.replace('"<tr><td colspan=\'4\'>Sin detalle disponible</td></tr>"', '"<div style=\'text-align:center;\'>Sin detalle disponible</div>"');
  fs.writeFileSync('frontend/js/clientes.js', js);
  console.log('Updated js ticket renderer');
} else {
  console.log('JS block not found or already replaced');
}
