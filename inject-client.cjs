const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const clientLogic = `
// ==========================================
// CLIENT LOGIC (RESTORED)
// ==========================================
window.openClientModal = async () => {
  if (!allClientes || allClientes.length === 0) {
    allClientes = await ClientesAPI.getAll(comercioId);
  }
  currentFilteredClientes = allClientes;
  modalVisibleCount = 20;
  if(typeof renderClientesBuscadorLazy === 'function') renderClientesBuscadorLazy(false);
  const m = document.getElementById("modalBuscarCliente");
  if(m) {
    m.style.display = "flex";
    document.getElementById("inputBuscarClienteModal")?.focus();
  }
};

document.getElementById("btnBuscarCliente")?.addEventListener("click", () => {
  window.targetClientInput = 'clienteVenta';
  window.targetClientNameInput = 'clienteVentaNombre';
  openClientModal();
});

document.getElementById("inputBuscarClienteModal")?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  currentFilteredClientes = allClientes.filter(c => c.nombre.toLowerCase().includes(q) || (c.documento && c.documento.includes(q)));
  modalVisibleCount = 20;
  if(typeof renderClientesBuscadorLazy === 'function') renderClientesBuscadorLazy(false);
});

document.getElementById("btnNuevoClienteDesdeBuscador")?.addEventListener("click", () => {
  document.getElementById("btnCrearClienteRapido")?.click();
});
`;

if (!js.includes('window.openClientModal = async () => {')) {
  js += clientLogic;
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('Injected client logic manually');
}

// Ensure the autocomplete target uses standard logic without strange signs
js = js.replace(/li\.textContent = c\.documento \? \`\$\\{c\.nombre\\} \(\$\\{c\.documento\\}\)\` : c\.nombre;/g, 'li.textContent = c.documento && c.documento.trim() !== "" ? `${c.nombre} (${c.documento})` : c.nombre;');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed js logic');
