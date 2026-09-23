const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const missingLupitas = `
// ==========================================
// LUPITAS EN DEVOLUCIONES
// ==========================================
document.getElementById("btnBuscarClienteDev")?.addEventListener("click", () => {
  window.targetClientInput = 'clienteDevolucion';
  window.targetClientNameInput = 'clienteDevolucionNombre';
  if(typeof window.openClientModal === 'function') window.openClientModal();
});

document.getElementById("btnBuscarProductoDev")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoDevolucion';
  window.targetProductNameInput = 'productoDevolucionNombre';
  if(typeof window.ensureProductosLoaded === 'function') await window.ensureProductosLoaded();
  if (typeof window.renderProductosModal === 'function') {
    window.renderProductosModal(productosCache);
  }
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});
`;

if (!js.includes('btnBuscarProductoDev')) {
  // Inject right before CLIENT LOGIC
  js = js.replace('// CLIENT LOGIC (RESTORED)', missingLupitas + '\n// CLIENT LOGIC (RESTORED)');
}

// Ensure btnBuscarProducto from POS works too
const missingMainLupita = `
document.getElementById("btnBuscarProducto")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoVenta';
  window.targetProductNameInput = 'productoVentaNombre';
  if(typeof window.ensureProductosLoaded === 'function') await window.ensureProductosLoaded();
  if (typeof window.renderProductosModal === 'function') {
    window.renderProductosModal(productosCache);
  }
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});
`;
if (!js.includes('btnBuscarProducto")?.addEventListener')) {
   js = js.replace('// CLIENT LOGIC (RESTORED)', missingMainLupita + '\n// CLIENT LOGIC (RESTORED)');
}

// And ensure buscarProductoModal input search works
const prodSearchInputListener = `
document.getElementById("buscarProductoModal")?.addEventListener("input", (e) => {
  const texto = e.target.value.toLowerCase();
  const filtrados = productosCache.filter((p) => p.nombre.toLowerCase().includes(texto) || (p.codigo_barras && p.codigo_barras.includes(texto)));
  if(typeof window.renderProductosModal === 'function') {
    window.renderProductosModal(filtrados);
  }
});
`;
if (!js.includes('buscarProductoModal")?.addEventListener("input"')) {
   js += prodSearchInputListener;
}


fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Restored all missing loupe functions');
