const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const anchor = '// ==========================================';

const newLogic = `
// ==========================================
// CREAR CLIENTE RAPIDO
// ==========================================
const btnCrearClienteRapido = document.getElementById("btnCrearClienteRapido");
const modalClienteRapido = document.getElementById("modalClienteRapido");
const cerrarModalClienteRapido = document.getElementById("cerrarModalClienteRapido");
const formClienteRapido = document.getElementById("formClienteRapido");

if (btnCrearClienteRapido) {
  btnCrearClienteRapido.addEventListener("click", () => {
    if (modalClienteRapido) {
      modalClienteRapido.style.display = "flex";
      document.getElementById("nombreClienteRapido").focus();
    }
  });
}

if (cerrarModalClienteRapido) {
  cerrarModalClienteRapido.addEventListener("click", () => {
    if (modalClienteRapido) modalClienteRapido.style.display = "none";
  });
}

if (formClienteRapido) {
  formClienteRapido.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnGuardarClienteRapido");
    const oldText = btn.textContent;
    btn.textContent = "Guardando...";
    btn.disabled = true;

    try {
      const p = {
        comercio_id: comercioId,
        nombre: document.getElementById("nombreClienteRapido").value.trim(),
        documento: document.getElementById("docClienteRapido").value.trim()
      };
      const res = await ClientesAPI.create(p);
      
      // Select the newly created client
      const clienteVenta = document.getElementById("clienteVenta");
      const clienteVentaNombre = document.getElementById("clienteVentaNombre");
      if(clienteVenta) clienteVenta.value = res.id;
      if(clienteVentaNombre) clienteVentaNombre.value = res.nombre;
      
      // Update local cache
      allClientes.push(res);
      currentFilteredClientes = allClientes;
      
      modalClienteRapido.style.display = "none";
      formClienteRapido.reset();
    } catch(err) {
      alert("Error al crear cliente.");
      console.error(err);
    } finally {
      btn.textContent = oldText;
      btn.disabled = false;
    }
  });
}
`;

if (!js.includes('CREAR CLIENTE RAPIDO')) {
  js = js.replace(anchor, newLogic);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('Injected modalClienteRapido logic in JS');
} else {
  console.log('Already injected JS');
}
