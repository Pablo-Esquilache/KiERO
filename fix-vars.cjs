const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// 1. We need to extract the imports and ensure they are at the top.
const importsRegex = /^import\s+\{[\s\S]*?\}\s+from\s+['"].\/api\.js['"];/m;
const match = js.match(importsRegex);

if (match) {
  // Remove the old import
  js = js.replace(match[0], '');
  // Put it at the absolute top
  js = match[0] + '\n\n' + js;
}

// 2. Ensure Dev Lazy State exists
const devLazyState = `
// DEVOLUCIONES LAZY LOAD STATE
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

if (!js.includes('let currentFilteredDevoluciones = [];')) {
  // Insert right after the imports
  const importEnd = js.indexOf(';') + 1;
  js = js.substring(0, importEnd) + '\n\n' + devLazyState + '\n' + js.substring(importEnd);
}

// 3. Ensure global helper is present (formatearFecha is missing maybe? No it's defined elsewhere, but let's make sure it doesn't crash)

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed lazy load states and imports');
