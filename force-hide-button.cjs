const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const targetStr = `  if(typeof renderClientesBuscadorLazy === 'function') renderClientesBuscadorLazy(false);`;
const insertion = `
  const btnNuevo = document.getElementById("btnNuevoClienteDesdeBuscador");
  if (btnNuevo) {
    if (window.targetClientInput === 'clienteDevolucion') {
      btnNuevo.style.setProperty('display', 'none', 'important');
    } else {
      btnNuevo.style.setProperty('display', 'inline-block', 'important');
    }
  }
`;

if (js.includes(targetStr) && !js.includes('btnNuevoClienteDesdeBuscador")) {')) {
  js = js.replace(targetStr, targetStr + insertion);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('Successfully injected button hide logic');
} else {
  console.log('Failed to inject or already injected');
}
