const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// Replace the current modalTicketDevolucion with the new style
const oldModal = /<!-- MODAL TICKET DEVOLUCION -->[\s\S]*?<div id="modalTicketDevolucion" class="app-modal" style="z-index: 10000;">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m;

const newModal = `<!-- MODAL TICKET DEVOLUCION -->
    <!-- ========================= -->
    <div id="modalTicketDevolucion" class="app-modal" style="z-index: 10000;">
      <div class="app-modal-content" style="max-width: 400px; padding: 0;">
        <div style="padding: 15px; border-bottom: 1px dashed #ccc; display: flex; justify-content: space-between; align-items: center; background: #fffbeb; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0; font-size: 1.2rem; color: #b45309;">Ticket Devolución</h2>
          <button type="button" class="app-btn-secondary" id="cerrarModalTicketDevolucion" style="padding: 5px 10px; font-size: 0.9em; border-color: #fcd34d; color: #b45309;">Cerrar</button>
        </div>
        
        <div id="ticketDevExitoContenido" style="padding: 20px; max-height: 50vh; overflow-y: auto; font-family: monospace; font-size: 14px;">
          <!-- Content generated via JS -->
        </div>

        <div style="padding: 15px; text-align: center; border-top: 1px dashed #ccc; background: #fffbeb; border-radius: 0 0 8px 8px;">
          <button type="button" id="btnImprimirTicketDevolucion" class="app-btn-primary" style="width: 100%; padding: 12px; font-size: 1.1em; background-color: #f59e0b; border: none;">Imprimir Ticket</button>
        </div>
      </div>
    </div>`;

if (oldModal.test(html)) {
  html = html.replace(oldModal, newModal);
} else {
  console.log("Could not find the old modal to replace!");
}

fs.writeFileSync('frontend/pages/ventas.html', html);


let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// Update window.verDetalleDevolucion to populate this new structure
const oldFunc = /window\.verDetalleDevolucion = async \(devolucionId\) => \{[\s\S]*?if\(modalTicketDev\) modalTicketDev\.style\.display = "flex";\n\s*\} catch\(err\) \{\n\s*console\.error\("Error al cargar detalle devolucion", err\);\n\s*\}\n\};/m;

const newFunc = `window.verDetalleDevolucion = async (devolucionId) => {
  try {
    const devoluciones = await DevolucionesAPI.getAll(comercioId);
    const devolucion = devoluciones.find((d) => d.id == devolucionId);
    if(!devolucion) return;

    const detalles = await DevolucionesAPI.getDetalle(devolucionId);

    const ticketContent = document.getElementById("ticketDevExitoContenido");
    if (ticketContent) {
      const fechaFormat = window.formatearFecha ? window.formatearFecha(devolucion.fecha) : devolucion.fecha;
      const clienteName = devolucion.cliente_nombre || "Consumidor Final";
      
      let itemsHtml = "";
      for(let item of detalles) {
          itemsHtml += \`<div style="display:flex; justify-content:space-between;"><span>\${item.cantidad}x \${item.producto_nombre || "Producto"}</span><span>\${Number(item.subtotal).toFixed(2)}</span></div>\`;
      }
      
      ticketContent.innerHTML = \`
          <div style="margin-bottom: 5px;"><strong>ID Devolución:</strong> \${devolucion.id}</div>
          <div style="margin-bottom: 5px;"><strong>Fecha:</strong> \${fechaFormat}</div>
          <div style="margin-bottom: 5px;"><strong>Cliente:</strong> \${clienteName}</div>
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          \${itemsHtml}
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">Total Reintegrado: $\${Number(devolucion.total).toFixed(2)}</div>
      \`;
    }

    const modalTicketDev = document.getElementById("modalTicketDevolucion");
    if(modalTicketDev) modalTicketDev.style.display = "flex";
  } catch(err) {
    console.error("Error al cargar detalle devolucion", err);
  }
};`;

js = js.replace(oldFunc, newFunc);

// Bind print functionality
const printBinding = `
document.getElementById("btnImprimirTicketDevolucion")?.addEventListener("click", () => {
  const contenido = document.getElementById("ticketDevExitoContenido")?.innerHTML || "";
  const ventana = window.open('', '_blank', 'width=300,height=500');
  ventana.document.write('<html><head><title>Imprimir Ticket Devolución</title></head><body style="font-family: monospace;">');
  ventana.document.write('<h3 style="text-align:center;">Comprobante de Devolución</h3>');
  ventana.document.write(contenido);
  ventana.document.write('</body></html>');
  ventana.document.close();
  ventana.onload = () => {
    ventana.print();
    ventana.close();
  };
});
`;

if (!js.includes('btnImprimirTicketDevolucion"')) {
  js = js.replace('// HELPERS (RESTORED)', '// HELPERS (RESTORED)\n' + printBinding);
}

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed styles in JS and HTML');
