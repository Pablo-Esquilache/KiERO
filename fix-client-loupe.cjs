const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// 1. Fix btnBuscarClienteDev
const oldBtnBuscarClienteDev = /document\.getElementById\("btnBuscarClienteDev"\)\?\.addEventListener\("click", \(\) => \{[\s\S]*?\}\);\n/m;
const newBtnBuscarClienteDev = `document.getElementById("btnBuscarClienteDev")?.addEventListener("click", () => {
  window.targetClientInput = 'clienteDevolucion';
  window.targetClientNameInput = 'clienteDevolucionNombre';
  if(typeof window.openClientModal === 'function') window.openClientModal();
});\n`;

js = js.replace(oldBtnBuscarClienteDev, newBtnBuscarClienteDev);

// 2. Add hide/show logic for btnNuevoClienteDesdeBuscador in openClientModal
const oldOpenClientModal = /window\.openClientModal = async \(\) => \{[\s\S]*?\}\n  \};/m;
const newOpenClientModal = `window.openClientModal = async () => {
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

js = js.replace(oldOpenClientModal, newOpenClientModal);

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed client modal loading and UI');
