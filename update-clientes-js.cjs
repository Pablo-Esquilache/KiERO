const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

// Replace the DOM section for CC with the new Modal Pago
js = js.replace(/const modalCC = document\.getElementById\("app-modal-cc"\);[\s\S]*?let clienteActualCC = null;/m,
`const modalPago = document.getElementById("app-modal-pago");
const btnRegistrarPagoHistorial = document.getElementById("btnRegistrarPagoHistorial");
const btnCerrarModalPago = document.getElementById("btnCerrarModalPago");
const ccRegistrarPago = document.getElementById("ccRegistrarPago");
const ccMontoPago = document.getElementById("ccMontoPago");`);

// Rewrite verHistorial completely
const oldVerHistorialRegex = /async function verHistorial\(clienteId\) \{[\s\S]*?\}\n\nasync function verDetalleVenta\(ventaId\)/m;

const newVerHistorialAndDetalle = `async function verHistorial(clienteId) {
  const role = session?.role;
  if (role !== "admin") {
    alert("No tenés permisos para ver el historial");
    return;
  }

  tablaHistorialBody.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";
  document.getElementById("resumenHistorial").innerHTML = "";

  try {
    // 1️⃣ Ventas y Devoluciones
    const ventas = await HistorialAPI.getVentasPorCliente(clienteId, comercioId);
    let devoluciones = [];
    try {
      const allDevoluciones = await fetch(\`/api/devoluciones?comercio_id=\${comercioId}\`).then(r=>r.json());
      devoluciones = allDevoluciones.filter(d => d.cliente_id == clienteId);
    } catch(e) { console.warn("Error cargando devoluciones"); }

    historialActual = ventas;
    clienteActualHistorial = clienteId;

    // 2️⃣ Saldo
    const dataSaldo = await ClientesAPI.getSaldo(clienteId, comercioId);
    const saldo = Number(dataSaldo.saldo);

    // 3️⃣ Unificar y ordenar movimientos (Ventas + Devoluciones)
    let movimientos = [];
    ventas.forEach(v => movimientos.push({...v, tipo_operacion: 'venta'}));
    devoluciones.forEach(d => movimientos.push({...d, tipo_operacion: 'devolucion', metodo_pago: 'A Favor'}));
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // 4️⃣ Matemática
    let totalEfectivo = 0;
    let totalDigital = 0;
    let totalDevoluciones = 0;
    let totalOperatoria = 0;

    ventas.forEach(v => {
      const vTot = Number(v.total);
      totalOperatoria += vTot;
      if (v.metodo_pago === 'Efectivo') {
        totalEfectivo += vTot;
      } else if (v.metodo_pago !== 'Cuenta Corriente') {
        totalDigital += vTot;
      }
    });
    devoluciones.forEach(d => {
      totalDevoluciones += Number(d.total);
    });

    // 5️⃣ Render Resumen
    let saldoHtml = '';
    if (saldo > 0) {
      saldoHtml = \`<strong style="color: #e53935; font-size: 16px;">$ \${saldo.toFixed(2)} (DEUDA)</strong>\`;
    } else if (saldo < 0) {
      saldoHtml = \`<strong style="color: #43a047; font-size: 16px;">$ \${Math.abs(saldo).toFixed(2)} (A FAVOR)</strong>\`;
    } else {
      saldoHtml = \`<strong style="font-size: 16px;">$ 0.00 (AL DÍA)</strong>\`;
    }

    document.getElementById("resumenHistorial").innerHTML = \`
      <div class="caja-card" style="border-left: 4px solid #10b981; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Efectivo</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ \${totalEfectivo.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid #3b82f6; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Digitales</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ \${totalDigital.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid #f59e0b; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Devoluciones</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ \${totalDevoluciones.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid #6366f1; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Total Operatoria</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ \${totalOperatoria.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid \${saldo > 0 ? '#e53935' : (saldo < 0 ? '#43a047' : '#94a3b8')}; padding: 10px; background: \${saldo > 0 ? '#ffebee' : (saldo < 0 ? '#e8f5e9' : '#f8fafc')}; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Cuenta Corriente</span><br/>
        \${saldoHtml}
      </div>
    \`;

    // 6️⃣ Render Tabla
    tablaHistorialBody.innerHTML = "";
    if (!movimientos.length) {
      tablaHistorialBody.innerHTML = "<tr><td colspan='5'>Sin movimientos registrados</td></tr>";
    } else {
      movimientos.forEach(m => {
        const isVenta = m.tipo_operacion === 'venta';
        tablaHistorialBody.innerHTML += \`
          <tr>
            <td>\${formatearFecha(m.fecha)}</td>
            <td>
              \${isVenta 
                ? '<span style="color:#1e293b; font-weight:500;">Venta</span>' 
                : '<span style="color:#f59e0b; font-weight:500;">Devolución</span>'}
            </td>
            <td>\${m.metodo_pago}</td>
            <td style="color:\${isVenta ? '#1e293b' : '#f59e0b'}">
              \${isVenta ? '' : '-'}$\${Number(m.total).toFixed(2)}
            </td>
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

    modalHistorial.style.display = "flex";
  } catch (error) {
    console.error(error);
    alert("Error cargando historial");
  }
}

async function verDetalleVenta(ventaId) {`;

js = js.replace(oldVerHistorialRegex, newVerHistorialAndDetalle);

// Remove the old cargarCuentaCorriente and ccRegistrarPago listeners at the bottom
const removeCCBlockRegex = /async function cargarCuentaCorriente\(clienteId\) \{[\s\S]*?(?=function formatearFecha)/m;
const newPaymentLogic = `
btnRegistrarPagoHistorial.addEventListener("click", () => {
  ccMontoPago.value = "";
  modalPago.style.display = "flex";
});

btnCerrarModalPago.addEventListener("click", () => {
  modalPago.style.display = "none";
});

ccRegistrarPago.addEventListener("click", async () => {
  const monto = Number(ccMontoPago.value);
  if (!monto || monto <= 0) {
    alert("Monto inválido");
    return;
  }
  
  if (!clienteActualHistorial) return;

  try {
    await fetch(\`/api/clientes/\${clienteActualHistorial}/pago\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comercio_id: comercioId, monto }),
    });
    alert("Pago registrado con éxito");
    ccMontoPago.value = "";
    modalPago.style.display = "none";
    // Refrescar historial
    await verHistorial(clienteActualHistorial);
    await cargarClientes();
  } catch(e) {
    alert("Error al registrar pago");
  }
});

`;

js = js.replace(removeCCBlockRegex, newPaymentLogic);

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('clientes.js updated');
