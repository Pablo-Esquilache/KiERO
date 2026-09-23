const fs = require('fs');

// 1. BACKEND REFACTOR
let backendJS = fs.readFileSync('backend/controllers/devolucionesController.js', 'utf8');

// Replace the signature and destructuring
backendJS = backendJS.replace(
  'const { venta_id, cliente_id, comercio_id, items, metodo_pago } = req.body;',
  'const { venta_id, cliente_id, comercio_id, items } = req.body;'
);
backendJS = backendJS.replace(
  'const metodoPagoFinal = metodo_pago || "Efectivo";',
  ''
);

// Replace the INSERT INTO devoluciones query
const oldInsertQuery = /`INSERT INTO devoluciones \(venta_id, cliente_id, total, comercio_id, fecha, metodo_pago\)\s*VALUES \(\$1, \$2, \$3, \$4, NOW\(\), \$5\) RETURNING \*`,\s*\[venta_id \|\| null, cliente_id \|\| null, totalDevolucion, comercio_id, metodoPagoFinal\]/m;

const newInsertQuery = `\`INSERT INTO devoluciones (venta_id, cliente_id, total, comercio_id, fecha)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *\`,
      [venta_id || null, cliente_id || null, totalDevolucion, comercio_id]`;

backendJS = backendJS.replace(oldInsertQuery, newInsertQuery);

// Remove the Cuenta Corriente block since we don't track payment method for returns anymore
const ccBlock = /\/\/ 5\. Si fue en cuenta corriente[\s\S]*?devolucion\.id\]\s*\);\s*\}/m;
backendJS = backendJS.replace(ccBlock, '// 5. Compensacion de CC removida por requerimiento de Devolucion Libre sin metodo de pago');

fs.writeFileSync('backend/controllers/devolucionesController.js', backendJS);
console.log('Fixed Backend devolucionesController');


// 2. FRONTEND HTML REFACTOR
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');
const oldHtmlSelect = /<select id="metodoPagoDevolucion" class="app-input">[\s\S]*?<\/select>/;
html = html.replace(oldHtmlSelect, ''); // Remove it completely
fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed HTML devoluciones method pago');


// 3. FRONTEND JS REFACTOR
let frontendJS = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// Remove metodo_pago from payload
frontendJS = frontendJS.replace(
  'const metPago = document.getElementById("metodoPagoDevolucion")?.value || "Efectivo";',
  ''
);
frontendJS = frontendJS.replace(
  'metodo_pago: metPago,',
  ''
);

// Make renderProductosModal global and point to the lazy loader
const globalRenderProd = `
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

if (!frontendJS.includes('window.renderProductosModal = function')) {
  frontendJS = frontendJS.replace('// DEVOLUCIONES LAZY LOAD STATE', globalRenderProd + '\n// DEVOLUCIONES LAZY LOAD STATE');
}

// Remove the old renderProductosModal if it's there
const oldRenderFunc = /function renderProductosModal\(lista\) \{[\s\S]*?\}\n    \}\);\n  \}/m;
if (oldRenderFunc.test(frontendJS)) {
  frontendJS = frontendJS.replace(oldRenderFunc, '// function renderProductosModal removed to use global version');
}

// Change typeof renderProductosModal === 'function' to window.renderProductosModal in the event listeners
frontendJS = frontendJS.replace(/if\s*\(typeof renderProductosModal === 'function'\)\s*\{\s*renderProductosModal\(productosCache\);\s*\}/g, 'if(typeof window.renderProductosModal === "function") { window.renderProductosModal(productosCache); }');

frontendJS = frontendJS.replace(/renderProductosModal\(filtrados\);/g, 'if(typeof window.renderProductosModal === "function") { window.renderProductosModal(filtrados); }');

fs.writeFileSync('frontend/js/ventas.js', frontendJS);
console.log('Fixed Frontend JS');
