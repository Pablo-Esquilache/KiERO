const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// A. Product Lazy Load
const prodLazyState = `// PRODUCT LAZY LOAD STATE
let prodVisibleCount = 20;
let currentFilteredProductos = [];

const renderProductosModalLazy = (append = false) => {
  const tabla = document.getElementById("tablaProductosModalBody");
  if (!tabla) return;
  if (!append) {
    tabla.innerHTML = "";
  }
  const limit = Math.min(prodVisibleCount, currentFilteredProductos.length);
  const startIndex = append ? prodVisibleCount - 20 : 0;
  for (let i = startIndex; i < limit; i++) {
    const p = currentFilteredProductos[i];
    const fila = document.createElement("tr");
    fila.innerHTML = \`<td>\${p.nombre}</td><td>\${p.stock}</td>\`;
    fila.style.cursor = "pointer";
    fila.addEventListener("click", () => {
      const tId = document.getElementById(window.targetProductInput || 'productoVenta');
      const tName = document.getElementById(window.targetProductNameInput || 'productoVentaNombre');
      if(tId) tId.value = p.id;
      if(tName) tName.value = p.nombre;
      
      const isDev = window.targetProductInput === 'productoDevolucion';
      const qtyInput = document.getElementById(isDev ? "cantidadDevolucion" : "cantidadVenta");
      if (qtyInput) qtyInput.focus();
      
      const modalProductos = document.getElementById("modalProductos");
      if(modalProductos) modalProductos.style.display = "none";
    });
    tabla.appendChild(fila);
  }
};
`;

const oldRenderProdModal = /function renderProductosModal\(productos\) \{[\s\S]*?\}\n\s*\}/m;
js = js.replace(oldRenderProdModal, `function renderProductosModal(productos) {
  currentFilteredProductos = productos;
  prodVisibleCount = 20;
  renderProductosModalLazy(false);
}`);

if (!js.includes('renderProductosModalLazy')) {
  js = prodLazyState + js;
}

// B. Devoluciones Lazy Load
const devLazyState = `
let devVisibleCount = 20;
let currentFilteredDevoluciones = [];

const renderDevolucionesLazy = (append = false) => {
  const tablaDevolucionesBody = document.getElementById("tablaDevolucionesBody");
  if (!tablaDevolucionesBody) return;
  
  if (!append) {
    tablaDevolucionesBody.innerHTML = "";
  }
  
  const limit = Math.min(devVisibleCount, currentFilteredDevoluciones.length);
  const startIndex = append ? devVisibleCount - 20 : 0;
  
  for (let i = startIndex; i < limit; i++) {
    const d = currentFilteredDevoluciones[i];
    const fila = document.createElement("tr");
    fila.innerHTML = \`
      <td>\${formatearFecha(d.fecha)}</td>
      <td>\${d.cliente_nombre || "Consumidor Final"}</td>
      <td>$\${Number(d.total).toFixed(2)}</td>
      <td>
        <button class="btn-ver-ticket btn-ver-devolucion" data-id="\${d.id}">Ver</button>
      </td>
    \`;
    tablaDevolucionesBody.appendChild(fila);
  }
  
  // Re-bind click events for newly rendered buttons
  document.querySelectorAll(".btn-ver-devolucion").forEach((b) =>
    b.addEventListener("click", () => verDetalleVenta(b.dataset.id))
  );
};
`;

const oldCargarDev = /async function cargarDevoluciones\(\) \{[\s\S]*?\}\n\s*\}/m;
js = js.replace(oldCargarDev, `async function cargarDevoluciones() {
  const devoluciones = await DevolucionesAPI.getAll(comercioId);
  currentFilteredDevoluciones = devoluciones;
  devVisibleCount = 20;
  renderDevolucionesLazy(false);
}`);

if (!js.includes('renderDevolucionesLazy')) {
  js = devLazyState + js;
}


// C. Bind Scroll events
const scrollBinds = `
// ===================================
// BIND SCROLL EVENTS FOR LAZY LOAD
// ===================================
document.addEventListener("DOMContentLoaded", () => {
  const scrollCli = document.getElementById("scrollClientesBuscador");
  if(scrollCli) {
    scrollCli.addEventListener("scroll", () => {
      if (scrollCli.scrollTop + scrollCli.clientHeight >= scrollCli.scrollHeight - 50) {
        if (modalVisibleCount < currentFilteredClientes.length) {
          modalVisibleCount += 20;
          renderClientesBuscadorLazy(true);
        }
      }
    });
  }
  
  const scrollProd = document.getElementById("scrollProductosBuscador");
  if(scrollProd) {
    scrollProd.addEventListener("scroll", () => {
      if (scrollProd.scrollTop + scrollProd.clientHeight >= scrollProd.scrollHeight - 50) {
        if (prodVisibleCount < currentFilteredProductos.length) {
          prodVisibleCount += 20;
          renderProductosModalLazy(true);
        }
      }
    });
  }
  
  const scrollDev = document.getElementById("scrollDevolucionesBuscador");
  if(scrollDev) {
    scrollDev.addEventListener("scroll", () => {
      if (scrollDev.scrollTop + scrollDev.clientHeight >= scrollDev.scrollHeight - 50) {
        if (devVisibleCount < currentFilteredDevoluciones.length) {
          devVisibleCount += 20;
          renderDevolucionesLazy(true);
        }
      }
    });
  }
});
`;

if (!js.includes('scrollDevolucionesBuscador')) {
  js += scrollBinds;
}

// Remove old broken scroll logic for clients just in case
const oldBrokenScroll = /const modalTablaContainer = document\.querySelector\("#modalBuscarCliente \.v-tabla-container"\);[\s\S]*?\}\n\s*\}\);\n\s*\}/m;
js = js.replace(oldBrokenScroll, '// old client scroll removed');


fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed js for lazy load');
