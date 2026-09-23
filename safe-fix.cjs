const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// 1. Remove metodo_pago
js = js.replace(
  'const metPago = document.getElementById("metodoPagoDevolucion")?.value || "Efectivo";',
  '// metPago removed'
);
js = js.replace(
  'metodo_pago: metPago,',
  ''
);

// 2. Make renderProductosModal global without deleting the original function body
// Instead of replacing the whole function, we just add a global alias at the top
const globalAlias = `
// GLOBAL ALIAS FOR PRODUCTS
window.renderProductosModal = function(lista) {
  if (typeof currentFilteredProductos !== 'undefined') {
    currentFilteredProductos = lista;
    prodVisibleCount = 20;
    if (typeof renderProductosModalLazy === 'function') {
      renderProductosModalLazy(false);
    }
  }
};
`;

if (!js.includes('window.renderProductosModal = function')) {
  js = js.replace('// DEVOLUCIONES LAZY LOAD STATE', globalAlias + '\n// DEVOLUCIONES LAZY LOAD STATE');
}

// 3. Fix the event listeners to call window.renderProductosModal
js = js.replace(`if (typeof renderProductosModal === 'function') {
    renderProductosModal(productosCache);
  }`, `if (typeof window.renderProductosModal === 'function') {
    window.renderProductosModal(productosCache);
  }`);

js = js.replace(`if (typeof renderProductosModal === 'function') {
      renderProductosModal(productosCache);
    }`, `if (typeof window.renderProductosModal === 'function') {
      window.renderProductosModal(productosCache);
    }`);

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed carefully');
