const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// The button hide logic inside openClientModal
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
}

// HTML height fixes
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

html = html.replace(/<div class="app-tabla-container" id="scrollClientesBuscador" style="max-height: 50vh; overflow-y: auto;">/g, '<div class="app-tabla-container" id="scrollClientesBuscador" style="height: 65vh; max-height: 65vh; overflow-y: auto;">');
html = html.replace(/<div class="app-tabla-container" id="scrollProductosBuscador" style="max-height: 50vh; overflow-y: auto;">/g, '<div class="app-tabla-container" id="scrollProductosBuscador" style="height: 65vh; max-height: 65vh; overflow-y: auto;">');
html = html.replace(/<div class="app-tabla-container" id="scrollDevolucionesBuscador" style="max-height: 50vh; overflow-y: auto;">/g, '<div class="app-tabla-container" id="scrollDevolucionesBuscador" style="height: 65vh; max-height: 65vh; overflow-y: auto;">');

// Remove metodoPagoDevolucion select from HTML
const oldHtmlSelect = /<select id="metodoPagoDevolucion" class="app-input">[\s\S]*?<\/select>/;
html = html.replace(oldHtmlSelect, ''); 

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed UI issues again');
