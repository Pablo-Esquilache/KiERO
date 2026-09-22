const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

const targetFunc = `async function cargarCuentaCorriente(clienteId) {
  const dataSaldo = await ClientesAPI.getSaldo(clienteId, comercioId);
  const saldo = dataSaldo.saldo;

  ccSaldo.textContent = \`Saldo: $\${saldo.toFixed(2)}\`;
  ccSaldo.style.color = saldo > 0 ? "red" : "lime";

  const movimientos = await ClientesAPI.getCuentaCorriente(
    clienteId,
    comercioId,
  );

  tablaCC.innerHTML = "";

  movimientos.forEach((m) => {
    tablaCC.innerHTML += \`
      <tr>
        <td>\${formatearFecha(m.created_at)}</td>
        <td>\${m.tipo}</td>
        <td>\${m.tipo === "venta" ? "+" : "-"}$\${Number(m.monto).toFixed(2)}</td>
      </tr>
    \`;
  });
}`;

const newFunc = `async function cargarCuentaCorriente(clienteId) {
  const dataSaldo = await ClientesAPI.getSaldo(clienteId, comercioId);
  const saldo = Number(dataSaldo.saldo);

  if (saldo > 0) {
    ccSaldo.innerHTML = \`DEUDA TOTAL: <span style="color: #e53935;">$ \${saldo.toFixed(2)}</span>\`;
  } else if (saldo < 0) {
    ccSaldo.innerHTML = \`SALDO A FAVOR: <span style="color: #43a047;">$ \${Math.abs(saldo).toFixed(2)}</span>\`;
  } else {
    ccSaldo.innerHTML = \`AL DÍA: <span style="color: #333;">$ 0.00</span>\`;
  }

  const movimientos = await ClientesAPI.getCuentaCorriente(
    clienteId,
    comercioId,
  );

  tablaCC.innerHTML = "";

  if (!movimientos || movimientos.length === 0) {
    tablaCC.innerHTML = "<tr><td colspan='3'>No hay movimientos registrados</td></tr>";
    return;
  }

  movimientos.forEach((m) => {
    const isDeuda = m.tipo === "venta";
    const amountStr = Number(m.monto).toFixed(2);
    tablaCC.innerHTML += \`
      <tr>
        <td>\${formatearFecha(m.created_at)}</td>
        <td>\${isDeuda ? '<span style="color:#e53935; font-weight:bold;">Compra fiada</span>' : '<span style="color:#43a047; font-weight:bold;">Pago realizado</span>'}</td>
        <td style="color: \${isDeuda ? '#e53935' : '#43a047'}">\${isDeuda ? "+" : "-"} $ \${amountStr}</td>
      </tr>
    \`;
  });
}`;

if (js.includes('ccSaldo.style.color = saldo > 0 ? "red" : "lime";')) {
    // try to replace the entire block
    const startIdx = js.indexOf('async function cargarCuentaCorriente(clienteId)');
    const endIdx = js.indexOf('}', js.indexOf('tablaCC.innerHTML +=', startIdx)) + 5;
    js = js.substring(0, startIdx) + newFunc + js.substring(endIdx);
    fs.writeFileSync('frontend/js/clientes.js', js);
    console.log("Updated cargarCuentaCorriente");
} else {
    console.log("Could not find the function block");
}
