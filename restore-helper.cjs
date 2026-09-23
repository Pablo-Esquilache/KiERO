const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const helper = `
// ==============================
// HELPERS (RESTORED)
// ==============================
window.formatearFecha = function(fechaISO) {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-AR");
};
function formatearFecha(fechaISO) {
  return window.formatearFecha(fechaISO);
}
`;

if (!js.includes('function formatearFecha')) {
  // Inject right after imports
  const importEnd = js.indexOf(';') + 1;
  js = js.substring(0, importEnd) + '\n\n' + helper + '\n' + js.substring(importEnd);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('Restored formatearFecha');
} else {
  console.log('Already exists');
}
