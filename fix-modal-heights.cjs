const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const oldOpenClient = /window\.openClientModal = async \(\) => \{[\s\S]*?\}\n  \};/m;
const newOpenClient = `window.openClientModal = async () => {
  if (!allClientes || allClientes.length === 0) {
    allClientes = await ClientesAPI.getAll(comercioId);
  }
  currentFilteredClientes = allClientes;
  modalVisibleCount = 20;
  if(typeof renderClientesBuscadorLazy === 'function') renderClientesBuscadorLazy(false);
  
  const btnNuevo = document.getElementById("btnNuevoClienteDesdeBuscador");
  if (btnNuevo) {
    btnNuevo.style.display = (window.targetClientInput === 'clienteDevolucion') ? 'none' : 'inline-block';
  }
  
  const m = document.getElementById("modalBuscarCliente");
  if(m) {
    m.style.display = "flex";
    document.getElementById("inputBuscarClienteModal")?.focus();
  }
};`;

js = js.replace(oldOpenClient, newOpenClient);
fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed window.openClientModal');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

html = html.replace(/<div class="app-tabla-container" id="scrollClientesBuscador" style="max-height: 50vh; overflow-y: auto;">/g, '<div class="app-tabla-container" id="scrollClientesBuscador" style="height: 65vh; max-height: 65vh; overflow-y: auto;">');
html = html.replace(/<div class="app-tabla-container" id="scrollProductosBuscador" style="max-height: 50vh; overflow-y: auto;">/g, '<div class="app-tabla-container" id="scrollProductosBuscador" style="height: 65vh; max-height: 65vh; overflow-y: auto;">');
html = html.replace(/<div class="app-tabla-container" id="scrollDevolucionesBuscador" style="max-height: 50vh; overflow-y: auto;">/g, '<div class="app-tabla-container" id="scrollDevolucionesBuscador" style="height: 65vh; max-height: 65vh; overflow-y: auto;">');

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed HTML heights');
