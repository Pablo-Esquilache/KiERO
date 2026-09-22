const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// 1. Fix btnBuscarClienteDev and btnBuscarProductoDev to call the preloading functions
const oldLupitaCliente = /document\.getElementById\("btnBuscarClienteDev"\)\?\.addEventListener\("click", \(\) => \{[\s\S]*?document\.getElementById\("inputBuscarClienteModal"\)\?\.focus\(\);\n\s*\}\);\n\s*\}\);/m;
const newLupitaCliente = `document.getElementById("btnBuscarClienteDev")?.addEventListener("click", () => {
    window.targetClientInput = 'clienteDevolucion';
    window.targetClientNameInput = 'clienteDevolucionNombre';
    if(typeof openClientModal === 'function') openClientModal();
  });`;

js = js.replace(oldLupitaCliente, newLupitaCliente);
// If it didn't match perfectly, let's just do targeted string replaces.
js = js.replace(`const m = document.getElementById("modalBuscarCliente");
    if(m) {
      m.style.display = "flex";
      document.getElementById("inputBuscarClienteModal")?.focus();
    }`, `if(typeof openClientModal === 'function') openClientModal();`);


const oldLupitaProducto = `document.getElementById("btnBuscarProductoDev")?.addEventListener("click", () => {
    window.targetProductInput = 'productoDevolucion';
    window.targetProductNameInput = 'productoDevolucionNombre';
    const m = document.getElementById("modalProductos");
    if(m) {
      m.style.display = "flex";
      document.getElementById("buscarProductoModal")?.focus();
    }
  });`;
const newLupitaProducto = `document.getElementById("btnBuscarProductoDev")?.addEventListener("click", () => {
    window.targetProductInput = 'productoDevolucion';
    window.targetProductNameInput = 'productoDevolucionNombre';
    if (typeof renderProductosModal === 'function') {
      renderProductosModal(productosCache);
    }
    const m = document.getElementById("modalProductos");
    if(m) {
      m.style.display = "flex";
      document.getElementById("buscarProductoModal")?.focus();
    }
  });`;
js = js.replace(oldLupitaProducto, newLupitaProducto);

// 2. Add missing cerrarModalBuscarCliente listener
if (!js.includes('cerrarModalBuscarCliente?.addEventListener("click"')) {
  js += `\nconst cerrarModalBuscarCliente = document.getElementById("cerrarModalBuscarCliente");
cerrarModalBuscarCliente?.addEventListener("click", () => {
  const m = document.getElementById("modalBuscarCliente");
  if (m) m.style.display = "none";
});\n`;
}

// 3. Fix client search weird symbol in autocomplete
js = js.replace(/li\.textContent = \`\\\$\\{c\.nombre\\} \(\\\$\\{c\.documento \|\| '- '\\}\\)\`;/g, 'li.textContent = c.documento ? `${c.nombre} (${c.documento})` : c.nombre;');

// 4. Fix product modal search to include barcode
const oldProdSearch = /const filtrados = productosCache\.filter\(\(p\) =>\s*p\.nombre\.toLowerCase\(\)\.includes\(texto\),\s*\);/m;
const newProdSearch = `const filtrados = productosCache.filter((p) => p.nombre.toLowerCase().includes(texto) || p.codigo_barras?.includes(texto));`;
js = js.replace(oldProdSearch, newProdSearch);

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed JS issues');

// Fix HTML for modalProductos width CSS collision
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');
html = html.replace('class="app-modal-content app-modal-productos" style="max-width: 800px;"', 'class="app-modal-content" style="max-width: 800px;"');
fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed HTML issues');
