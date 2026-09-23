const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// Regex to find the whole CREAR CLIENTE RAPIDO block
const blockRegex = /\/\/ ==========================================\n\/\/ CREAR CLIENTE RAPIDO\n\/\/ ==========================================\n[\s\S]*?document\.getElementById\("btnNuevoClienteDesdeBuscador"\)\?\.addEventListener\("click", \(\) => \{\n\s*document\.getElementById\("btnCrearClienteRapido"\)\?\.click\(\);\n\}\);/g;

const newLogic = `// ==========================================
// CREAR CLIENTE (COPIA EXACTA DE CLIENTES)
// ==========================================
const btnCrearClienteRapido = document.getElementById("btnCrearClienteRapido");
const modalClienteRapido = document.getElementById("modalClienteRapido");
const cerrarModalClienteRapido = document.getElementById("cerrarModalClienteRapido");
const formCliente = document.getElementById("formCliente");

const btnNuevaLocalidad = document.getElementById("btnNuevaLocalidad");
const campoLocalidad = document.getElementById("localidad");
const campoNuevaLocalidad = document.getElementById("nuevaLocalidad");

function mostrarInputNuevaLocalidad(mostrar) {
  if (!campoNuevaLocalidad || !campoLocalidad) return;
  if (mostrar) {
    campoNuevaLocalidad.style.display = "block";
    campoLocalidad.style.display = "none";
  } else {
    campoNuevaLocalidad.style.display = "none";
    campoLocalidad.style.display = "inline-block";
    campoNuevaLocalidad.value = "";
  }
}

if (btnNuevaLocalidad) {
  btnNuevaLocalidad.addEventListener("click", () => mostrarInputNuevaLocalidad(true));
}

// Cargar localidades al abrir o al iniciar
async function cargarLocalidadesVentas() {
  if (!campoLocalidad) return;
  try {
    const localidades = await ClientesAPI.getLocalidades(comercioId);
    campoLocalidad.innerHTML = \`<option value="">Seleccionar localidad</option>\`;
    localidades.forEach((loc) => {
      campoLocalidad.innerHTML += \`<option value="\${loc}">\${loc}</option>\`;
    });
  } catch (e) {
    console.error("Error cargando localidades", e);
  }
}

if (btnCrearClienteRapido) {
  btnCrearClienteRapido.addEventListener("click", () => {
    if (modalClienteRapido) {
      document.getElementById("formCliente")?.reset();
      mostrarInputNuevaLocalidad(false);
      cargarLocalidadesVentas();
      modalClienteRapido.style.display = "flex";
      setTimeout(() => document.getElementById("nombre")?.focus(), 100);
    }
  });
}

if (cerrarModalClienteRapido) {
  cerrarModalClienteRapido.addEventListener("click", () => {
    if (modalClienteRapido) modalClienteRapido.style.display = "none";
  });
}

if (formCliente) {
  formCliente.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = formCliente.querySelector('button[type="submit"]');
    const oldText = btn ? btn.textContent : "Guardar";
    if(btn) {
      btn.textContent = "Guardando...";
      btn.disabled = true;
    }

    try {
      const localidadFinal = campoNuevaLocalidad?.value.trim() || campoLocalidad?.value || "";

      const p = {
        comercio_id: comercioId,
        nombre: document.getElementById("nombre")?.value.trim() || "",
        fecha_nacimiento: document.getElementById("fechaNacimiento")?.value || null,
        genero: document.getElementById("genero")?.value || "",
        telefono: document.getElementById("telefono")?.value.trim() || "",
        email: document.getElementById("email")?.value.trim() || "",
        localidad: localidadFinal,
        comentarios: document.getElementById("comentarios")?.value.trim() || ""
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
      formCliente.reset();
    } catch (err) {
      alert(err.message || "Error creando cliente");
    } finally {
      if(btn) {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    }
  });
}

document.getElementById("btnNuevoClienteDesdeBuscador")?.addEventListener("click", () => {
  document.getElementById("btnCrearClienteRapido")?.click();
});`;

if (js.match(blockRegex)) {
  js = js.replace(blockRegex, newLogic);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log("Updated client creation logic in ventas.js");
} else {
  console.log("Could not find the block regex in ventas.js");
}
