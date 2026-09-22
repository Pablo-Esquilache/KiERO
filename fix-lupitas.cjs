const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// A. Add target variables for Modals
const globalsInsertion = `// Global targets for Modals
window.targetClientInput = 'clienteVenta';
window.targetClientNameInput = 'clienteVentaNombre';
window.targetProductInput = 'productoVenta';
window.targetProductNameInput = 'productoVentaNombre';\n\n`;

// Only add if not already there
if (!js.includes('window.targetClientInput')) {
  js = globalsInsertion + js;
}

// B. Update Client Modal Row Click
const oldCliRowClick = /document\.getElementById\("clienteVenta"\)\.value = c\.id;\s*document\.getElementById\("clienteVentaNombre"\)\.value = c\.nombre;/g;
const newCliRowClick = `document.getElementById(window.targetClientInput).value = c.id;
        document.getElementById(window.targetClientNameInput).value = c.nombre;`;
js = js.replace(oldCliRowClick, newCliRowClick);

// C. Update Product Modal Row Click
const oldProdRowClick = /productoVenta\.value = p\.id;\s*productoVentaNombre\.value = p\.nombre;/g;
const newProdRowClick = `const tId = document.getElementById(window.targetProductInput);
      const tName = document.getElementById(window.targetProductNameInput);
      if(tId) tId.value = p.id;
      if(tName) tName.value = p.nombre;`;
js = js.replace(oldProdRowClick, newProdRowClick);

// D. Update Open Client Modal function
const oldOpenClient = /const openClientModal = \(\) => \{/g;
const newOpenClient = `const openClientModal = () => {
      window.targetClientInput = 'clienteVenta';
      window.targetClientNameInput = 'clienteVentaNombre';`;
js = js.replace(oldOpenClient, newOpenClient);

// E. Append new Lupitas logic for Devoluciones at the end of the file
const newLupitasLogic = `
// ==========================================
// LUPITAS EN DEVOLUCIONES
// ==========================================
document.getElementById("btnBuscarClienteDev")?.addEventListener("click", () => {
  window.targetClientInput = 'clienteDevolucion';
  window.targetClientNameInput = 'clienteDevolucionNombre';
  const m = document.getElementById("modalBuscarCliente");
  if(m) {
    m.style.display = "flex";
    document.getElementById("inputBuscarClienteModal")?.focus();
  }
});

document.getElementById("btnBuscarProductoDev")?.addEventListener("click", () => {
  window.targetProductInput = 'productoDevolucion';
  window.targetProductNameInput = 'productoDevolucionNombre';
  const m = document.getElementById("modalProductosVenta"); // might be named different
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});

// Update the main POS button to set targets
document.getElementById("btnBuscarProducto")?.addEventListener("click", () => {
  window.targetProductInput = 'productoVenta';
  window.targetProductNameInput = 'productoVentaNombre';
  // modal open logic is elsewhere, this just sets targets
});
`;

if (!js.includes('btnBuscarClienteDev')) {
  js += newLupitasLogic;
}

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed js modals for lupitas');
