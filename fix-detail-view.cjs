const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// 1. Change the event binding to use a new global function window.verDetalleDevolucion
// Note: In some versions it was verDetalleVenta, we'll replace it carefully.
js = js.replace(/b\.addEventListener\("click", \(\) => verDetalleVenta\(b\.dataset\.id\)\)/g, 'b.addEventListener("click", () => { if(window.verDetalleDevolucion) window.verDetalleDevolucion(b.dataset.id); })');

// 2. Add the window.verDetalleDevolucion function
const helper = `
window.verDetalleDevolucion = async (devolucionId) => {
  try {
    const devoluciones = await DevolucionesAPI.getAll(comercioId);
    const devolucion = devoluciones.find((d) => d.id == devolucionId);
    if(!devolucion) return;

    const detalles = await DevolucionesAPI.getDetalle(devolucionId);

    document.getElementById("ticketDevId").textContent = devolucion.id;
    document.getElementById("ticketDevFecha").textContent = window.formatearFecha ? window.formatearFecha(devolucion.fecha) : devolucion.fecha;
    document.getElementById("ticketDevCliente").textContent = devolucion.cliente_nombre || "-";
    document.getElementById("ticketDevTotal").textContent = Number(devolucion.total).toFixed(2);

    const tbody = document.getElementById("ticketDevDetalleBody");
    if (tbody) {
      tbody.innerHTML = "";
      detalles.forEach((item) => {
        const fila = document.createElement("tr");
        fila.innerHTML = \`
          <td>\${item.producto_nombre || "Producto"}</td>
          <td>\${item.cantidad}</td>
          <td>$\${Number(item.precio_unitario).toFixed(2)}</td>
          <td>$\${Number(item.subtotal).toFixed(2)}</td>
        \`;
        tbody.appendChild(fila);
      });
    }

    const modalTicketDev = document.getElementById("modalTicketDev");
    if(modalTicketDev) modalTicketDev.style.display = "flex";
  } catch(err) {
    console.error("Error al cargar detalle devolucion", err);
  }
};
`;

if (!js.includes('window.verDetalleDevolucion = async')) {
  js = js.replace('// HELPERS (RESTORED)', '// HELPERS (RESTORED)\n' + helper);
}

// 3. Prevent btn-ver-ticket from capturing devoluciones clicks
js = js.replace(/document\.querySelectorAll\("\.btn-ver-ticket"\)\.forEach/g, 'document.querySelectorAll(".btn-ver-ticket:not(.btn-ver-devolucion)").forEach');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed devoluciones detail view');
