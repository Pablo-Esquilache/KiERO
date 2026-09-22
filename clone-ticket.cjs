const fs = require('fs');

// ========================================================
// 1. UPDATE CLIENTES.HTML
// ========================================================
let html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');

const modalDetalleRegex = /<div id="app-modal-detalle"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m;

const newModalDetalle = `<!-- MODAL DETALLE VENTA / TICKET (Z-INDEX 1100) -->
    <div id="app-modal-detalle" class="app-modal" style="z-index: 1100; display: none;">
      <div class="app-modal-content" style="max-width: 400px; padding: 0;">
        <div style="padding: 15px; border-bottom: 1px dashed #ccc; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 1.2rem; color: #1e293b;">Detalle de Operación</h2>
          <button type="button" id="btnImprimirTicketHistorial" class="app-btn-secondary" style="padding: 5px 10px; font-size: 0.9em;">🖨 Imprimir</button>
        </div>
        
        <div id="ticketContenidoImprimir" style="padding: 20px; max-height: 50vh; overflow-y: auto; font-family: monospace; font-size: 14px;">
          <div style="margin-bottom: 5px;"><strong>Cliente:</strong> <span id="ticketNombreCli"></span></div>
          <div style="margin-bottom: 5px;"><strong>ID:</strong> <span id="ticketIdDetalle"></span></div>
          <div style="margin-bottom: 5px;"><strong>Fecha:</strong> <span id="ticketFechaDetalle"></span></div>
          <div style="margin-bottom: 5px;"><strong>Método de pago:</strong> <span id="ticketMetodoDetalle"></span></div>
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          <div id="tablaDetalleBody">
            <!-- JS -->
          </div>
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">
            Total: $<span id="detalleTotal"></span>
          </div>
        </div>

        <div style="padding: 15px; text-align: center; border-top: 1px dashed #ccc; background: #f8fafc; border-radius: 0 0 8px 8px;">
          <button type="button" class="app-close-detalle app-btn-primary" style="width: 100%; padding: 12px; font-size: 1.1em; background-color: #64748b; border: none;">Cerrar Ticket</button>
        </div>
      </div>
    </div>`;

html = html.replace(modalDetalleRegex, newModalDetalle);
fs.writeFileSync('frontend/pages/clientes.html', html);


// ========================================================
// 2. UPDATE CLIENTES.JS
// ========================================================
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

// Replace the client name injection since we now have #ticketNombreCli
const oldClientNameInjection = /\/\/ Cabecera Cliente en Ticket[\s\S]*?ticketClienteDiv\.innerHTML = \`<strong>Cliente:<\/strong> \$\{nombreCli\}\`;/m;
const newClientNameInjection = `// Cabecera Cliente en Ticket
    const cliObj = clientes.find(c => c.id == clienteActualHistorial);
    const nombreCli = cliObj ? cliObj.nombre : "Consumidor Final";
    document.getElementById("ticketNombreCli").textContent = nombreCli;`;

js = js.replace(oldClientNameInjection, newClientNameInjection);

// Inject Imprimir listener at the end
if (!js.includes("btnImprimirTicketHistorial")) {
  js += `
// Imprimir ticket historial
document.getElementById("btnImprimirTicketHistorial")?.addEventListener("click", () => {
  const contenido = document.getElementById("ticketContenidoImprimir").innerHTML;
  const ventana = window.open('', '_blank', 'width=300,height=500');
  ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
  ventana.document.write(contenido);
  ventana.document.write('</body></html>');
  ventana.document.close();
  ventana.onload = () => {
    ventana.print();
    ventana.close();
  };
});
`;
}

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Done cloning ticket styles');
