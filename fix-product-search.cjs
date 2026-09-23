const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// 1. Create a helper to load products safely
const loadProductosHelper = `
window.ensureProductosLoaded = async () => {
  if (!productosCache || productosCache.length === 0) {
    productosCache = await ProductosAPI.getAll(comercioId);
  }
};
`;

if (!js.includes('window.ensureProductosLoaded')) {
  js = js.replace('// DEVOLUCIONES LAZY LOAD STATE', loadProductosHelper + '\n// DEVOLUCIONES LAZY LOAD STATE');
}

// 2. Fix productoDevolucionNombre input listener
const oldInputListener = /productoDevolucionNombre\?\.addEventListener\("input", \(e\) => \{[\s\S]*?if\(autocompleteProductosDevolucion\) autocompleteProductosDevolucion\.style\.display = "block";\n\}\);/m;
const newInputListener = `productoDevolucionNombre?.addEventListener("input", async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.innerHTML = "";
  if (!q) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
    if(productoDevolucion) productoDevolucion.value = "";
    return;
  }
  
  await window.ensureProductosLoaded();
  
  const filtrados = productosCache.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
    return;
  }
  filtrados.forEach(p => {
    const li = document.createElement("li");
    li.textContent = \`\${p.nombre} - $\${Number(p.precio).toFixed(2)}\`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(productoDevolucion) productoDevolucion.value = p.id;
      if(productoDevolucionNombre) productoDevolucionNombre.value = p.nombre;
      if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
      if(cantidadDevolucion) cantidadDevolucion.focus();
    });
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.appendChild(li);
  });
  if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "block";
});`;

if (oldInputListener.test(js)) {
  js = js.replace(oldInputListener, newInputListener);
}

// 3. Fix btnBuscarProductoDev to await products
const oldBtnBuscarProdDev = /document\.getElementById\("btnBuscarProductoDev"\)\?\.addEventListener\("click", \(\) => \{[\s\S]*?document\.getElementById\("buscarProductoModal"\)\?\.focus\(\);\n  \}\);/m;
const newBtnBuscarProdDev = `document.getElementById("btnBuscarProductoDev")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoDevolucion';
  window.targetProductNameInput = 'productoDevolucionNombre';
  await window.ensureProductosLoaded();
  if (typeof renderProductosModal === 'function') {
    renderProductosModal(productosCache);
  }
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});`;
js = js.replace(oldBtnBuscarProdDev, newBtnBuscarProdDev);

// 4. Fix Main POS btnBuscarProducto to await products
const oldBtnBuscarProd = /document\.getElementById\("btnBuscarProducto"\)\?\.addEventListener\("click", \(\) => \{[\s\S]*?\}\);/m;
const newBtnBuscarProd = `document.getElementById("btnBuscarProducto")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoVenta';
  window.targetProductNameInput = 'productoVentaNombre';
  await window.ensureProductosLoaded();
  if (typeof renderProductosModal === 'function') {
    renderProductosModal(productosCache);
  }
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});`;
js = js.replace(oldBtnBuscarProd, newBtnBuscarProd);

// 5. Fix Barcode scan in main POS
const oldBarcode = /if \(barcodeVenta\) \{[\s\S]*?barcodeVenta\.value = "";\n\s*barcodeVenta\.focus\(\);\n\s*\}\n\s*\}\);\n\s*\}/m;
const newBarcode = `if (barcodeVenta) {
  barcodeVenta.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeVenta.value.trim();
      if (!code) return;

      await window.ensureProductosLoaded();
      
      const producto = productosCache.find((p) => p.codigo_barras && p.codigo_barras.trim() === code);
      
      if (!producto) {
        alert("Producto no encontrado con ese código.");
        barcodeVenta.value = "";
        return;
      }

      procesarAgregarProducto(producto.id, 1);
      
      barcodeVenta.value = "";
      barcodeVenta.focus();
    }
  });
}`;
js = js.replace(oldBarcode, newBarcode);

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed Product searches');
