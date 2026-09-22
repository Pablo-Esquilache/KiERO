const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

// =========================================================
// Fix 1: Historial modal title to use client name
// =========================================================
let html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');
html = html.replace(/<h2 class="app-subtitle" style="margin:0;">Historial de Cliente<\/h2>/, 
                    '<h2 class="app-subtitle" id="tituloHistorialCliente" style="margin:0;">Historial de Cliente</h2>');
fs.writeFileSync('frontend/pages/clientes.html', html);

// =========================================================
// Fix 2 & 3: Rewrite verHistorial Render and verDetalleVenta Render
// =========================================================
const verHistorialStart = js.indexOf('// 6️⃣ Render Tabla');
const verHistorialEnd = js.indexOf('    modalHistorial.style.display = "flex";', verHistorialStart);

if (verHistorialStart > -1 && verHistorialEnd > -1) {
  const newTablaBlock = `    // 6️⃣ Render Tabla
    tablaHistorialBody.innerHTML = "";
    
    // NOMBRES:
    const cliObj = clientes.find(c => c.id == clienteId);
    const nombreHeader = cliObj ? cliObj.nombre : "Cliente";
    const tituloHistorial = document.getElementById("tituloHistorialCliente");
    if (tituloHistorial) tituloHistorial.textContent = "Historial de " + nombreHeader;

    if (!movimientos.length) {
      tablaHistorialBody.innerHTML = "<tr><td colspan='5'>Sin movimientos registrados</td></tr>";
    } else {
      movimientos.forEach(m => {
        const isVenta = m.tipo_operacion === 'venta';
        const isPago = m.tipo_operacion === 'pago';
        
        let labelOperacion = '';
        let colorOperacion = '';
        let prefijoMonto = '';
        let colorMonto = '';
        
        if (isVenta) {
          labelOperacion = 'Venta';
          colorOperacion = '#1e293b';
          prefijoMonto = '';
          colorMonto = '#1e293b';
        } else if (isPago) {
          labelOperacion = 'Pago de Deuda';
          colorOperacion = '#10b981';
          prefijoMonto = '+';
          colorMonto = '#10b981';
        } else {
          labelOperacion = 'Devolución';
          colorOperacion = '#f59e0b';
          prefijoMonto = '-';
          colorMonto = '#f59e0b';
        }

        tablaHistorialBody.innerHTML += \`
          <tr>
            <td>\${formatearFecha(m.fecha)}</td>
            <td><span style="color:\${colorOperacion}; font-weight:500;">\${labelOperacion}</span></td>
            <td>\${m.metodo_pago}</td>
            <td style="color:\${colorMonto}; font-weight:bold;">\${prefijoMonto}$\${Number(m.total).toFixed(2)}</td>
            <td>
              \${isVenta ? \`<button class="btn-ver-detalle" data-id="\${m.id}">Ver Tique</button>\` : '-'}
            </td>
          </tr>
        \`;
      });
      document.querySelectorAll(".btn-ver-detalle").forEach((b) =>
        b.addEventListener("click", () => verDetalleVenta(b.dataset.id))
      );
    }

`;
  js = js.substring(0, verHistorialStart) + newTablaBlock + js.substring(verHistorialEnd);
} else {
  console.log("Could not find verHistorial start/end");
}

const verDetalleStart = js.indexOf('async function verDetalleVenta(ventaId) {');
const verDetalleEnd = js.indexOf('detalleTotal.textContent = total.toFixed(2);', verDetalleStart);

if (verDetalleStart > -1 && verDetalleEnd > -1) {
  const newVerDetalleBlock = `async function verDetalleVenta(ventaId) {
  try {
    const data = await VentasAPI.getDetalle(ventaId);
    
    // Obtenemos info del historial para mostrar en cabecera
    const infoVenta = historialActual.find((v) => v.id == ventaId);

    if (infoVenta) {
      document.getElementById("ticketIdDetalle").textContent = infoVenta.id;
      document.getElementById("ticketFechaDetalle").textContent = formatearFecha(infoVenta.fecha);
      document.getElementById("ticketMetodoDetalle").textContent = infoVenta.metodo_pago;
    }

    // Cabecera Cliente en Ticket
    const cliObj = clientes.find(c => c.id == clienteActualHistorial);
    const nombreCli = cliObj ? cliObj.nombre : "Consumidor Final";
    
    // Buscamos si existe el div del cliente, sino lo creamos.
    let ticketClienteDiv = document.getElementById("ticketClienteDetalle");
    if (!ticketClienteDiv) {
      ticketClienteDiv = document.createElement("div");
      ticketClienteDiv.id = "ticketClienteDetalle";
      ticketClienteDiv.style.marginBottom = "5px";
      const fechaDiv = document.getElementById("ticketFechaDetalle").parentNode;
      fechaDiv.parentNode.insertBefore(ticketClienteDiv, fechaDiv);
    }
    ticketClienteDiv.innerHTML = \`<strong>Cliente:</strong> \${nombreCli}\`;

    tablaDetalleBody.innerHTML = "";
    let total = 0;

    if (!data.length) {
      tablaDetalleBody.innerHTML = "<div style='text-align:center;'>Sin detalle disponible</div>";
    } else {
      data.forEach((item) => {
        total += Number(item.subtotal);

        tablaDetalleBody.innerHTML += \`
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; font-size: 13px;">\${item.producto_nombre || "Producto sin nombre"}</div>
            <div style="display: flex; justify-content: space-between; color: #555; font-size: 13px;">
              <span>\${item.cantidad} x $\${Number(item.precio_unitario).toFixed(2)}</span>
              <span>$\${Number(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        \`;
      });
    }

    detalleActual = data;
    ventaActualDetalle = ventaId;

    `;
  js = js.substring(0, verDetalleStart) + newVerDetalleBlock + js.substring(verDetalleEnd);
} else {
  console.log("Could not find verDetalleVenta start/end");
}

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Fixed robustly');
