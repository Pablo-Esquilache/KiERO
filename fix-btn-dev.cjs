const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const oldBtnDev = /document\.getElementById\("btnBuscarProductoDev"\)\?\.addEventListener\("click", \(\) => \{\s*window\.targetProductInput = 'productoDevolucion';\s*window\.targetProductNameInput = 'productoDevolucionNombre';\s*const m = document\.getElementById\("modalProductos"\);\s*if\(m\) \{\s*m\.style\.display = "flex";\s*document\.getElementById\("buscarProductoModal"\)\?\.focus\(\);\s*\}\s*\}\);/m;

const newBtnDev = `document.getElementById("btnBuscarProductoDev")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoDevolucion';
  window.targetProductNameInput = 'productoDevolucionNombre';
  
  if(typeof window.ensureProductosLoaded === 'function') {
    await window.ensureProductosLoaded();
  }
  if(typeof window.renderProductosModal === 'function') {
    window.renderProductosModal(productosCache);
  }
  
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});`;

if (oldBtnDev.test(js)) {
  js = js.replace(oldBtnDev, newBtnDev);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('Fixed btnBuscarProductoDev safely');
} else {
  console.log('Could not find btnBuscarProductoDev to replace. Regex failed.');
}
