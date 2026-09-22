const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

// =======================================================
// 1. Añadir Pagos a verHistorial
// =======================================================
const oldFetchDeudas = `    const ventas = await HistorialAPI.getVentasPorCliente(clienteId, comercioId);
    let devoluciones = [];
    try {
      const allDevoluciones = await DevolucionesAPI.getAll(comercioId);
      devoluciones = allDevoluciones.filter(d => d.cliente_id == clienteId);
    } catch(e) { console.warn("Error cargando devoluciones"); }

    historialActual = ventas;`;

const newFetchDeudas = `    const ventas = await HistorialAPI.getVentasPorCliente(clienteId, comercioId);
    let devoluciones = [];
    let pagos = [];
    try {
      const allDevoluciones = await DevolucionesAPI.getAll(comercioId);
      devoluciones = allDevoluciones.filter(d => d.cliente_id == clienteId);
    } catch(e) { console.warn("Error cargando devoluciones"); }
    
    try {
      const ccData = await ClientesAPI.getCuentaCorriente(clienteId, comercioId);
      pagos = ccData.filter(m => m.tipo === 'pago');
    } catch(e) { console.warn("Error cargando pagos"); }

    historialActual = ventas;`;

js = js.replace(oldFetchDeudas, newFetchDeudas);

const oldMovimientosMerge = `    let movimientos = [];
    ventas.forEach(v => movimientos.push({...v, tipo_operacion: 'venta'}));
    devoluciones.forEach(d => movimientos.push({...d, tipo_operacion: 'devolucion', metodo_pago: 'A Favor'}));
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));`;

const newMovimientosMerge = `    let movimientos = [];
    ventas.forEach(v => movimientos.push({...v, tipo_operacion: 'venta'}));
    devoluciones.forEach(d => movimientos.push({...d, tipo_operacion: 'devolucion', metodo_pago: 'A Favor'}));
    pagos.forEach(p => movimientos.push({...p, fecha: p.created_at, tipo_operacion: 'pago', metodo_pago: 'Efectivo', total: p.monto}));
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));`;

js = js.replace(oldMovimientosMerge, newMovimientosMerge);

const oldTablaRender = `      movimientos.forEach(m => {
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
      });`;

const newTablaRender = `      movimientos.forEach(m => {
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
      });`;

js = js.replace(oldTablaRender, newTablaRender);


// =======================================================
// 2. Tique formato Vertical
// =======================================================
const oldTicketRender = `        data.forEach((item) => {
          total += Number(item.subtotal);
          tablaDetalleBody.innerHTML += \`<div style="display:flex; justify-content:space-between;"><span>\${item.cantidad}x \${item.producto_nombre || "-"}</span><span>\${Number(item.subtotal).toFixed(2)}</span></div>\`;
        });`;

const newTicketRender = `        data.forEach((item) => {
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
        });`;

js = js.replace(oldTicketRender, newTicketRender);


fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Done');
