const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

js = js.replace(/getElementById\("modalTicketDev"\)/g, 'getElementById("modalTicketDevolucion")');

// Add listener to close modalTicketDevolucion
const closeListener = `
document.getElementById("cerrarModalTicketDevolucion")?.addEventListener("click", () => {
  const m = document.getElementById("modalTicketDevolucion");
  if(m) m.style.display = "none";
});
`;

if (!js.includes('cerrarModalTicketDevolucion")?.addEventListener')) {
  js = js.replace('// HELPERS (RESTORED)', closeListener + '\n// HELPERS (RESTORED)');
}

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed JS references to modalTicketDevolucion');
