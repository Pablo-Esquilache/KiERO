const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const oldLogicStart = js.indexOf('// ==========================================\r\n// CREAR CLIENTE RAPIDO');
if (oldLogicStart === -1) {
  const oldLogicStartLF = js.indexOf('// ==========================================\n// CREAR CLIENTE RAPIDO');
  if (oldLogicStartLF === -1) {
    console.log("Could not find start");
    process.exit(1);
  }
}

const targetStartStr = js.includes('\r\n') ? '// ==========================================\r\n// CREAR CLIENTE RAPIDO' : '// ==========================================\n// CREAR CLIENTE RAPIDO';
const targetEndStr = '    });\n  }';

const startIdx = js.indexOf(targetStartStr);
let searchEndIdx = js.indexOf('// NUEVA LÓGICA DEVOLUCIONES LIBRES', startIdx);
if (searchEndIdx === -1) searchEndIdx = js.indexOf('// NUEVA L"GICA DEVOLUCIONES LIBRES', startIdx);
if (searchEndIdx === -1) searchEndIdx = js.indexOf('// NUEVA', startIdx);

if (startIdx !== -1 && searchEndIdx !== -1) {
  // Find the closing brace of the form logic just before searchEndIdx
  const block = js.substring(startIdx, searchEndIdx);
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
      
      const clienteVenta = document.getElementById("clienteVenta");
      const clienteVentaNombre = document.getElementById("clienteVentaNombre");
      if(clienteVenta) clienteVenta.value = res.id;
      if(clienteVentaNombre) clienteVentaNombre.value = res.nombre;
      
      if (typeof allClientes !== 'undefined') {
        allClientes.push(res);
        currentFilteredClientes = allClientes;
      }
      
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

`;

  js = js.substring(0, startIdx) + newLogic + js.substring(searchEndIdx);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log("Restored missing code and replaced exactly the client block");
} else {
  console.log("Could not find start or end index");
}
