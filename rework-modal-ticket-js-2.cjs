const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const anchorBegin = 'function activarBotonesVerTicket() {';
const anchorEnd = 'console.error("Error obteniendo ticket:", error);\n        }\n      });\n    });\n  }';

const newLogic = `function activarBotonesVerTicket() {
    document.querySelectorAll(".btn-ver-ticket:not(.btn-ver-devolucion)").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const ventaId = btn.dataset.id;
          const venta = ventasCacheModal.find((v) => v.id == ventaId) || ventasCachePrincipal.find((v) => v.id == ventaId);
          if (!venta) return;
  
          const detalles = await VentasAPI.getDetalle(ventaId);
          
          let itemsHtml = "";
          for(let item of detalles) {
              itemsHtml += \`<div style="display:flex; justify-content:space-between;"><span>\${item.cantidad}x \${item.producto_nombre || "Producto"}</span><span>\${Number(item.subtotal).toFixed(2)}</span></div>\`;
          }
          
          let descHtml = "";
          if (Number(venta.descuento_monto) > 0) {
            descHtml = \`<div style="display:flex; justify-content:space-between; color: #e63946;"><span>Descuento (\${venta.descuento_porcentaje}%)</span><span>-\${Number(venta.descuento_monto).toFixed(2)}</span></div>\`;
          }

          const ticketHTML = \`
            <div style="margin-bottom: 5px;"><strong>ID Venta:</strong> \${venta.id}</div>
            <div style="margin-bottom: 5px;"><strong>Fecha:</strong> \${formatearFecha(venta.fecha)}</div>
            <div style="margin-bottom: 5px;"><strong>Cliente:</strong> \${venta.cliente_nombre || "Consumidor Final"}</div>
            <div style="margin-bottom: 5px;"><strong>Método de pago:</strong> \${venta.metodo_pago}</div>
            <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
            \${itemsHtml}
            \${descHtml ? \`<div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>\${descHtml}\` : ""}
            <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
            <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">Total: $\${Number(venta.total).toFixed(2)}</div>
          \`;

          document.getElementById("ticketHistorialContenido").innerHTML = ticketHTML;
          document.getElementById("modalTicket").style.display = "flex";
        } catch (error) {
          console.error("Error obteniendo ticket:", error);
        }
      });
    });
  }`;

const regex = /function activarBotonesVerTicket\(\) \{[\s\S]*?console\.error\("Error obteniendo ticket:", error\);\n\s*\}\n\s*\}\);\n\s*\}\);\n\s*\}/;

if (js.match(regex)) {
  js = js.replace(regex, newLogic);
  
  const addPrintBtn = `
  const btnImprimirTicketHistorial = document.getElementById("btnImprimirTicketHistorial");
  if(btnImprimirTicketHistorial) {
    btnImprimirTicketHistorial.addEventListener("click", () => {
      const contenido = document.getElementById("ticketHistorialContenido")?.innerHTML || "";
      const ventana = window.open('', '_blank', 'width=300,height=500');
      ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
      ventana.document.write('<h3 style="text-align:center;">Comprobante de Venta</h3>');
      ventana.document.write(contenido);
      ventana.document.write('</body></html>');
      ventana.document.close();
      ventana.onload = () => {
        ventana.print();
        ventana.close();
      };
    });
  }`;
  
  if(!js.includes("btnImprimirTicketHistorial.addEventListener")) {
    js += addPrintBtn;
  }

  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log("Replaced activating buttons function");
} else {
  console.log("Could not find regex");
}
