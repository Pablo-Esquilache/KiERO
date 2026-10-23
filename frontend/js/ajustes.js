import { API_BASE_URL } from "./api.js";

function getAuthToken() {
  try {
    const s = JSON.parse(localStorage.getItem("session") || "{}");
    return s.token || null;
  } catch {
    return null;
  }
}

const authFetch = async (url, options = {}) => {
  options.headers = options.headers || {};
  const token = getAuthToken();
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  return globalThis.fetch(url.startsWith('/api') ? API_BASE_URL + url.substring(4) : url, options);
};
document.addEventListener("DOMContentLoaded", () => {
  const session = JSON.parse(localStorage.getItem("session") || "{}");
  const token = session.token;

  if (session.role !== "admin") {
    alert("Acceso denegado. Redirigiendo...");
    window.location.href = "ventas.html";
    return;
  }

  const cid = session.comercio_id || 1;
// authFetch declared at module level

//   // ===== ECOMMERCE SYNC =====
//   const txtUrl = document.getElementById("apiUrlSync");
//   const txtToken = document.getElementById("apiTokenSync");
//   const chkEnabled = document.getElementById("syncEnabledSwitch");
//   const formSync = document.getElementById("formCloudSync");
//   const btnGuardarSync = document.getElementById("btnGuardarSync");
// 
//   async function cargarConfigSync() {
//     try {
//       const res = await authFetch("/api/config-sync", {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       if (res.ok) {
//         const data = await res.json();
//         txtUrl.value = data.api_url || "http://127.0.0.1:3000/api/sync";
//         txtToken.value = data.api_token || "";
//         chkEnabled.checked = data.sync_enabled || false;
//       }
//     } catch (e) {
//       console.warn("No se pudo cargar config sync", e);
//     }
//   }
// 
//   formSync.addEventListener("submit", async (e) => {
//     e.preventDefault();
//     const url = txtUrl.value.trim();
//     const tkn = txtToken.value.trim();
//     const isEnabled = chkEnabled.checked;
//     const oldText = btnGuardarSync.textContent;
// 
//     btnGuardarSync.textContent = "Guardando...";
//     btnGuardarSync.disabled = true;
// 
//     try {
//       const res = await authFetch("/api/config-sync", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token}`
//         },
//         body: JSON.stringify({ api_url: url, api_token: tkn, sync_enabled: isEnabled })
//       });
// 
//       if (res.ok) {
//         alert("Configuración de E-Commerce guardada.");
//       } else {
//         alert("Error al guardar la configuración");
//       }
//     } catch (error) {
//       console.error(error);
//       alert("Error de red");
//     } finally {
//       btnGuardarSync.textContent = oldText;
//       btnGuardarSync.disabled = false;
//     }
//   });

  // ===== METODOS DE PAGO =====
  const listaMetodos = document.getElementById("listaMetodos");
  const inputNuevoMetodo = document.getElementById("nuevoMetodoInput");
  const btnNuevoMetodo = document.getElementById("btnNuevoMetodo");

  async function cargarMetodos() {
    listaMetodos.innerHTML = "<p>Cargando...</p>";
    try {
      const res = await authFetch(`/api/ajustes/metodos_pago/${cid}`);
      const data = await res.json();
      listaMetodos.innerHTML = "";
      data.forEach(m => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${m.nombre}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label class="switch-ui small">
              <input type="checkbox" ${m.activo ? "checked" : ""} data-id="${m.id}" class="toggle-metodo">
              <span class="slider"><span class="slider-dot"></span></span>
            </label>
            <button class="btn-eliminar-metodo" data-id="${m.id}" style="background:transparent; border:none; color: #ef4444; cursor:pointer;" title="Eliminar">🗑</button>
          </div>
        `;
        listaMetodos.appendChild(li);
      });
    } catch (e) { console.error(e); }
  }

  btnNuevoMetodo.addEventListener("click", async () => {
    const nombre = inputNuevoMetodo.value.trim();
    if (!nombre) return;
    try {
      const res = await authFetch("/api/ajustes/metodos_pago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comercio_id: cid, nombre })
      });
      if (res.ok) {
        inputNuevoMetodo.value = "";
        cargarMetodos();
      }
    } catch (e) { console.error(e); }
  });

  listaMetodos.addEventListener("change", async (e) => {
    if (e.target.classList.contains("toggle-metodo")) {
      const id = e.target.getAttribute("data-id");
      const activo = e.target.checked;
      try {
        await authFetch(`/api/ajustes/metodos_pago/${id}/toggle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo })
        });
      } catch (e) { console.error(e); e.target.checked = !activo; }
    }
  });


  // ===== DESCUENTOS =====
  const listaDescuentos = document.getElementById("listaDescuentos");
  const inputNuevoDescuento = document.getElementById("nuevoDescuentoInput");
  const btnNuevoDescuento = document.getElementById("btnNuevoDescuento");

  async function cargarDescuentos() {
    listaDescuentos.innerHTML = "<p>Cargando...</p>";
    try {
      const res = await authFetch(`/api/ajustes/descuentos/${cid}`);
      const data = await res.json();
      listaDescuentos.innerHTML = "";
      data.forEach(d => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${d.porcentaje}%</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label class="switch-ui small">
              <input type="checkbox" ${d.activo ? "checked" : ""} data-id="${d.id}" class="toggle-descuento">
              <span class="slider"><span class="slider-dot"></span></span>
            </label>
            <button class="btn-eliminar-descuento" data-id="${d.id}" style="background:transparent; border:none; color: #ef4444; cursor:pointer;" title="Eliminar">🗑</button>
          </div>
        `;
        listaDescuentos.appendChild(li);
      });
    } catch (e) { console.error(e); }
  }

  btnNuevoDescuento.addEventListener("click", async () => {
    const porc = parseFloat(inputNuevoDescuento.value);
    if (isNaN(porc)) return;
    try {
      const res = await authFetch("/api/ajustes/descuentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comercio_id: cid, porcentaje: porc })
      });
      if (res.ok) {
        inputNuevoDescuento.value = "";
        cargarDescuentos();
      }
    } catch (e) { console.error(e); }
  });

  listaDescuentos.addEventListener("change", async (e) => {
    if (e.target.classList.contains("toggle-descuento")) {
      const id = e.target.getAttribute("data-id");
      const activo = e.target.checked;
      try {
        await authFetch(`/api/ajustes/descuentos/${id}/toggle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo })
        });
      } catch (e) { console.error(e); e.target.checked = !activo; }
    }
  });

  // --- LOGICA DE ELIMINACION COMBINADA ---
  listaMetodos.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-eliminar-metodo")) {
      if(!confirm("¿Eliminar este método de pago?")) return;
      const id = e.target.getAttribute("data-id");
      try {
        await authFetch(`/api/ajustes/metodos_pago/${id}`, { method: "DELETE" });
        cargarMetodos();
      } catch (err) { console.error(err); }
    }
  });

  listaDescuentos.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-eliminar-descuento")) {
      if(!confirm("¿Eliminar este descuento?")) return;
      const id = e.target.getAttribute("data-id");
      try {
        await authFetch(`/api/ajustes/descuentos/${id}`, { method: "DELETE" });
        cargarDescuentos();
      } catch (err) { console.error(err); }
    }
  });

  // ===== CATEGORIAS DE GASTOS =====
  const listaCategoriasGasto = document.getElementById("listaCategoriasGasto");
  const nuevaCategoriaGastoInput = document.getElementById("nuevaCategoriaGastoInput");
  const btnNuevaCategoriaGasto = document.getElementById("btnNuevaCategoriaGasto");

  async function cargarCategoriasGasto() {
    listaCategoriasGasto.innerHTML = "<p>Cargando...</p>";
    try {
      const res = await authFetch(`/api/ajustes/gastos_categorias/${cid}`);
      const data = await res.json();
      listaCategoriasGasto.innerHTML = "";
      data.forEach(c => {
        const li = document.createElement("li");
        li.innerHTML = `
          <span>${c.nombre}</span>
          <div style="display: flex; align-items: center; gap: 8px;">
            <label class="switch-ui small">
              <input type="checkbox" ${c.activo ? "checked" : ""} data-id="${c.id}" class="toggle-categoria-gasto">
              <span class="slider"><span class="slider-dot"></span></span>
            </label>
            <button class="btn-eliminar-categoria-gasto" data-id="${c.id}" style="background:transparent; border:none; color: #ef4444; cursor:pointer;" title="Eliminar">🗑</button>
          </div>
        `;
        listaCategoriasGasto.appendChild(li);
      });
    } catch (e) { console.error(e); }
  }

  btnNuevaCategoriaGasto.addEventListener("click", async () => {
    const nombre = nuevaCategoriaGastoInput.value.trim();
    if (!nombre) return;
    try {
      const res = await authFetch("/api/ajustes/gastos_categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comercio_id: cid, nombre })
      });
      if (res.ok) {
        nuevaCategoriaGastoInput.value = "";
        cargarCategoriasGasto();
      }
    } catch (e) { console.error(e); }
  });

  listaCategoriasGasto.addEventListener("change", async (e) => {
    if (e.target.classList.contains("toggle-categoria-gasto")) {
      const id = e.target.getAttribute("data-id");
      const activo = e.target.checked;
      try {
        await authFetch(`/api/ajustes/gastos_categorias/${id}/toggle`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activo })
        });
      } catch (e) { console.error(e); e.target.checked = !activo; }
    }
  });

  listaCategoriasGasto.addEventListener("click", async (e) => {
    if (e.target.classList.contains("btn-eliminar-categoria-gasto")) {
      if(!confirm("¿Eliminar esta categoría de gasto?")) return;
      const id = e.target.getAttribute("data-id");
      try {
        await authFetch(`/api/ajustes/gastos_categorias/${id}`, { method: "DELETE" });
        cargarCategoriasGasto();
      } catch (err) { console.error(err); }
    }
  });

  // ===== TURNERO CONFIG =====
  const formTurnosConfig = document.getElementById("formTurnosConfig");
  const turnosEnabledSwitch = document.getElementById("turnosEnabledSwitch");
  const horaInicioTurnos = document.getElementById("horaInicioTurnos");
  const horaFinTurnos = document.getElementById("horaFinTurnos");
  const intervaloTurnos = document.getElementById("intervaloTurnos");
  const solapamientoTurnosSwitch = document.getElementById("solapamientoTurnosSwitch");
  const btnGuardarTurnosConfig = document.getElementById("btnGuardarTurnosConfig");

  async function cargarTurnosConfig() {
    try {
      const res = await authFetch(`/api/ajustes/turnos_config/${cid}`);
      if (res.ok) {
        const data = await res.json();
        turnosEnabledSwitch.checked = data.modulo_habilitado;
        horaInicioTurnos.value = data.hora_inicio_laboral ? data.hora_inicio_laboral.slice(0, 5) : "08:00";
        horaFinTurnos.value = data.hora_fin_laboral ? data.hora_fin_laboral.slice(0, 5) : "20:00";
        intervaloTurnos.value = data.intervalo_minutos || 30;
        solapamientoTurnosSwitch.checked = data.permitir_solapamiento;
      }
    } catch (e) {
      console.error("Error al cargar config de turnos", e);
    }
  }

  formTurnosConfig.addEventListener("submit", async (e) => {
    e.preventDefault();
    const oldText = btnGuardarTurnosConfig.textContent;
    btnGuardarTurnosConfig.textContent = "Guardando...";
    btnGuardarTurnosConfig.disabled = true;

    const payload = {
      modulo_habilitado: turnosEnabledSwitch.checked,
      hora_inicio_laboral: horaInicioTurnos.value,
      hora_fin_laboral: horaFinTurnos.value,
      intervalo_minutos: parseInt(intervaloTurnos.value),
      permitir_solapamiento: solapamientoTurnosSwitch.checked,
    };

    try {
      const res = await authFetch(`/api/ajustes/turnos_config/${cid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Configuración del Turnero guardada.");
      } else {
        alert("Error al guardar la configuración.");
      }
    } catch (error) {
      console.error(error);
      alert("Error de red");
    } finally {
      btnGuardarTurnosConfig.textContent = oldText;
      btnGuardarTurnosConfig.disabled = false;
    }
  });

  // ===== ALERTAS DE STOCK =====
  const inputUmbralStock = document.getElementById("inputUmbralStock");
  const btnGuardarUmbral = document.getElementById("btnGuardarUmbral");

  async function cargarUmbralStock() {
    try {
      // Necesitamos fetchear data del comercio para el umbral
      const res = await authFetch(`/api/comercios/uid/${session.uid}`);
      if(res.ok) {
        const data = await res.json();
        inputUmbralStock.value = data.umbral_stock || 3;
      }
    } catch (e) { console.error("Error al cargar umbral de stock", e); }
  }

  btnGuardarUmbral.addEventListener("click", async () => {
    const val = parseInt(inputUmbralStock.value);
    if(isNaN(val)) return;
    try {
      const res = await authFetch(`/api/ajustes/umbral_stock/${cid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ umbral_stock: val })
      });
      if(res.ok) {
        alert("Umbral actualizado");
      }
    } catch (e) { console.error(e); }
  });

  // ===== MANEJO DE USUARIOS =====
  const tablaUsuariosBody = document.getElementById("tablaUsuariosBody");
  const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");
  const modalUsuario = document.getElementById("modalUsuario");
  const cerrarModalUsuario = document.getElementById("cerrarModalUsuario");
  const formUsuario = document.getElementById("formUsuario");
  let usuariosCache = [];

  async function cargarUsuarios() {
    try {
      const res = await authFetch(`/api/usuarios/${cid}`);
      const data = await res.json();
      usuariosCache = data;
      tablaUsuariosBody.innerHTML = "";
      data.forEach(u => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
          <td>${u.id}</td>
          <td>${u.usuario}</td>
          <td><span class="user-role-badge" style="background:${u.role==='admin'?'#3fd18c':'#666'}; padding:2px 6px; border-radius:4px; font-size:0.8em;">${u.role}</span></td>
          <td>
            <button class="btn-editar-usuario app-btn-secondary" data-id="${u.id}" style="padding:4px 8px; font-size:0.85em;">Editar</button>
            <button class="btn-eliminar-usuario" data-id="${u.id}" style="background:transparent; border:none; color: #ef4444; cursor:pointer;" title="Eliminar">🗑</button>
          </td>
        `;
        tablaUsuariosBody.appendChild(fila);
      });
    } catch (e) { console.error("Error al cargar usuarios", e); }
  }

  btnNuevoUsuario.addEventListener("click", () => {
    formUsuario.reset();
    document.getElementById("usuarioIdMode").value = "";
    document.getElementById("tituloModalUsuario").innerText = "Crear Usuario";
    modalUsuario.style.display = "flex";
  });

  cerrarModalUsuario.addEventListener("click", () => {
    modalUsuario.style.display = "none";
  });

  formUsuario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const modeId = document.getElementById("usuarioIdMode").value;
    const usuario = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const role = document.getElementById("roleInput").value;

    try {
      if (modeId) {
        // Edit
        const body = { role, usuario };
        if (password) body.password = password;
        const res = await authFetch(`/api/usuarios/${modeId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        if(res.ok) {
          modalUsuario.style.display = "none";
          cargarUsuarios();
        } else {
          const err = await res.json();
          alert(err.error);
        }
      } else {
        // Create
        if (!password) { alert("La contraseña es requerida para un nuevo usuario"); return; }
        const res = await authFetch(`/api/usuarios`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario, password, role, comercio_id: cid })
        });
        if(res.ok) {
          modalUsuario.style.display = "none";
          cargarUsuarios();
        } else {
          const err = await res.json();
          alert(err.error);
        }
      }
    } catch (error) { console.error(error); }
  });

  tablaUsuariosBody.addEventListener("click", async (e) => {
    const btn = e.target;
    if (btn.classList.contains("btn-eliminar-usuario")) {
      if(!confirm("¿Deseas eliminar este usuario de forma permanente?")) return;
      const id = btn.getAttribute("data-id");
      try {
        await authFetch(`/api/usuarios/${id}`, { method: "DELETE" });
        cargarUsuarios();
      } catch (err) { console.error(err); }
    } else if (btn.classList.contains("btn-editar-usuario")) {
      const id = btn.getAttribute("data-id");
      const user = usuariosCache.find(x => x.id == id);
      if(user) {
        formUsuario.reset();
        document.getElementById("usuarioIdMode").value = user.id;
        document.getElementById("usernameInput").value = user.usuario;
        document.getElementById("roleInput").value = user.role;
        document.getElementById("tituloModalUsuario").innerText = "Editar Usuario";
        modalUsuario.style.display = "flex";
      }
    }
  });


  // Init
  // cargarConfigSync();
  cargarTurnosConfig();
  cargarMetodos();
  cargarDescuentos();
  cargarCategoriasGasto();
  cargarUmbralStock();
  cargarUsuarios();

// ==========================================
// Botón de Copia de Seguridad Manual (SQL)
// ==========================================
const backupBtn = document.getElementById("backup-btn");
if (backupBtn) {
  backupBtn.addEventListener("click", async () => {
    try {
      backupBtn.disabled = true;
      const originalText = backupBtn.textContent;
      backupBtn.textContent = "⏳ Generando...";

      const session = JSON.parse(localStorage.getItem("session"));
      const comercioId = session?.comercio_id;

      const res = await fetch(API_BASE_URL + `/exportar-tabla/sql?comercio_id=${comercioId}`, {
        headers: { "Authorization": `Bearer ${session?.token || ''}` }
      });
      if (!res.ok) throw new Error("Error al descargar backup");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_kiero_${new Date().toISOString().split('T')[0]}.sql`;
      a.click();
      URL.revokeObjectURL(url);
      
      if (typeof Swal !== "undefined") {
          Swal.fire({
              icon: "success",
              title: "Copia Resguardada",
              text: "El archivo .sql se ha descargado exitosamente.",
              timer: 3000,
              showConfirmButton: false
          });
      } else {
          alert("Backup descargado exitosamente.");
      }
    } catch (err) {
      console.error(err);
      if (typeof Swal !== "undefined") {
          Swal.fire({
              icon: "error",
              title: "Error al generar backup",
              text: "Hubo un problema. Intente nuevamente más tarde.",
          });
      } else {
          alert("Error al generar copia de seguridad.");
      }
    } finally {
      backupBtn.disabled = false;
      backupBtn.textContent = "💾 Descargar Backup";
    }
  });
  }

  // ==========================================
  // AUMENTO MASIVO DE PRECIOS
  // ==========================================
  const selectProveedorAumento = document.getElementById("selectProveedorAumento");
  const inputPorcentajeAumento = document.getElementById("inputPorcentajeAumento");
  const selectRedondeoAumento = document.getElementById("selectRedondeoAumento");
  const btnAplicarAumento = document.getElementById("btnAplicarAumento");
  const containerUltimoAumento = document.getElementById("containerUltimoAumento");
  const textoDetalleUltimoAumento = document.getElementById("textoDetalleUltimoAumento");
  const btnRevertirAumento = document.getElementById("btnRevertirAumento");

  let ultimoAumentoActivo = null;

  async function cargarProveedoresAjustes() {
    if (!selectProveedorAumento) return;
    try {
      const res = await authFetch("/api/productos/proveedores/lista");
      if (res.ok) {
        const proveedores = await res.json();
        selectProveedorAumento.innerHTML = '<option value="TODOS">Todos los proveedores</option>';
        proveedores.forEach((prov) => {
          const opt = document.createElement("option");
          opt.value = prov;
          opt.textContent = prov;
          selectProveedorAumento.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("Error cargando proveedores para aumento:", e);
    }
  }

  async function verificarUltimoAumento() {
    if (!containerUltimoAumento) return;
    try {
      const res = await authFetch(`/api/ajustes/ultimo-aumento/${cid}`);
      if (res.ok) {
        const data = await res.json();
        ultimoAumentoActivo = data;
        if (data && data.revertido === 0) {
          containerUltimoAumento.style.display = "flex";
          const provText = data.proveedor === "TODOS" ? "Todos los proveedores" : `"${data.proveedor}"`;
          textoDetalleUltimoAumento.textContent = `+${data.porcentaje}% en ${data.cantidad_productos} producto(s) (${provText}) el ${data.fecha}`;
        } else {
          containerUltimoAumento.style.display = "none";
        }
      }
    } catch (e) {
      console.error("Error verificando último aumento:", e);
    }
  }

  if (btnAplicarAumento) {
    btnAplicarAumento.addEventListener("click", async () => {
      const prov = selectProveedorAumento.value;
      const pct = parseFloat(inputPorcentajeAumento.value);
      const redondeo = selectRedondeoAumento.value;

      if (isNaN(pct) || pct <= 0) {
        alert("Por favor ingrese un porcentaje de aumento válido mayor a 0.");
        inputPorcentajeAumento.focus();
        return;
      }

      btnAplicarAumento.disabled = true;
      btnAplicarAumento.textContent = "Calculando...";

      try {
        // Previsualizar cantidad real
        const prevRes = await authFetch(`/api/ajustes/aumento-masivo/previsualizar/${cid}?proveedor=${encodeURIComponent(prov)}`);
        if (!prevRes.ok) throw new Error("Error al consultar productos");
        const { count } = await prevRes.json();

        if (count === 0) {
          alert(`No se encontraron productos activos con precio para el criterio seleccionado ("${prov}").`);
          btnAplicarAumento.disabled = false;
          btnAplicarAumento.textContent = "Aplicar Aumento";
          return;
        }

        const nombreProv = prov === "TODOS" ? "todos los proveedores" : `el proveedor "${prov}"`;
        const confirmacion = confirm(
          `⚠️ ATENCIÓN:\n\nEsta acción aumentará un ${pct}% el precio de ${count} producto(s) correspondientes a ${nombreProv}.\n\nTipo de redondeo: ${redondeo}.\n\n¿Desea continuar y aplicar el aumento ahora?`
        );

        if (!confirmacion) {
          btnAplicarAumento.disabled = false;
          btnAplicarAumento.textContent = "Aplicar Aumento";
          return;
        }

        btnAplicarAumento.textContent = "Aplicando...";
        const res = await authFetch("/api/ajustes/aumento-masivo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comercio_id: cid,
            proveedor: prov,
            porcentaje: pct,
            tipo_redondeo: redondeo
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al aplicar aumento");

        // Invalida caché local del POS para actualización inmediata
        localStorage.removeItem(`productos_cache_${cid}`);

        alert(`✅ ${data.mensaje}`);
        inputPorcentajeAumento.value = "";
        await verificarUltimoAumento();
        await cargarProveedoresAjustes();
      } catch (err) {
        console.error("Error en aumento masivo:", err);
        alert(`❌ Error: ${err.message}`);
      } finally {
        btnAplicarAumento.disabled = false;
        btnAplicarAumento.textContent = "Aplicar Aumento";
      }
    });
  }

  if (btnRevertirAumento) {
    btnRevertirAumento.addEventListener("click", async () => {
      if (!ultimoAumentoActivo) return;

      const confirmacion = confirm(
        `⚠️ ¿Está seguro de revertir el último aumento del ${ultimoAumentoActivo.porcentaje}%?\n\nSe restaurarán los precios que no hayan sido modificados manualmente luego del aumento.`
      );

      if (!confirmacion) return;

      btnRevertirAumento.disabled = true;
      btnRevertirAumento.textContent = "Revirtiendo...";

      try {
        const res = await authFetch("/api/ajustes/revertir-aumento", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comercio_id: cid,
            log_id: ultimoAumentoActivo.id
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al revertir aumento");

        // Invalida caché local
        localStorage.removeItem(`productos_cache_${cid}`);

        alert(`✅ ${data.mensaje}`);
        await verificarUltimoAumento();
      } catch (err) {
        console.error("Error revirtiendo aumento:", err);
        alert(`❌ Error: ${err.message}`);
      } finally {
        btnRevertirAumento.disabled = false;
        btnRevertirAumento.textContent = "↩ Revertir último aumento";
      }
    });
  }

  // Cargar aumento masivo al abrir Ajustes
  cargarProveedoresAjustes();
  verificarUltimoAumento();


  // ===========================================================
  // CONFIGURACIÓN FISCAL AFIP / ARCA
  // ===========================================================
  const formConfigFiscal = document.getElementById("formConfigFiscal");
  const fiscalCuitInput = document.getElementById("fiscalCuitInput");
  const fiscalCondicionIvaSelect = document.getElementById("fiscalCondicionIvaSelect");
  const fiscalPtoVtaInput = document.getElementById("fiscalPtoVtaInput");
  const fiscalAmbienteSelect = document.getElementById("fiscalAmbienteSelect");
  const fiscalCertFile = document.getElementById("fiscalCertFile");
  const fiscalKeyFile = document.getElementById("fiscalKeyFile");
  const badgeCertStatus = document.getElementById("badgeCertStatus");
  const badgeKeyStatus = document.getElementById("badgeKeyStatus");
  const badgeEstadoFiscal = document.getElementById("badgeEstadoFiscal");
  const fiscalCertVencimiento = document.getElementById("fiscalCertVencimiento");
  const fiscalFeedbackMsg = document.getElementById("fiscalFeedbackMsg");
  const btnTestAfip = document.getElementById("btnTestAfip");
  const btnGuardarFiscal = document.getElementById("btnGuardarFiscal");
  const fiscalCuitValidationMsg = document.getElementById("fiscalCuitValidationMsg");

  function validarCuitModulo11(cuitRaw) {
    if (!cuitRaw) return { valid: false, error: "Vacío" };
    const clean = String(cuitRaw).replace(/\D/g, "");
    if (clean.length !== 11) return { valid: false, error: "Debe tener 11 dígitos" };
    const prefijos = ["20", "23", "24", "27", "30", "33", "34"];
    if (!prefijos.includes(clean.slice(0, 2))) return { valid: false, error: "Prefijo no válido" };
    const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;
    for (let i = 0; i < 10; i++) suma += parseInt(clean[i], 10) * mult[i];
    const mod = 11 - (suma % 11);
    const digito = mod === 11 ? 0 : (mod === 10 ? 9 : mod);
    if (parseInt(clean[10], 10) !== digito) return { valid: false, error: "Dígito verificador inválido" };
    return {
      valid: true,
      clean,
      formatted: `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
    };
  }

  if (fiscalCuitInput) {
    fiscalCuitInput.addEventListener("input", () => {
      const val = fiscalCuitInput.value.trim();
      if (!val) {
        fiscalCuitValidationMsg.innerHTML = "";
        return;
      }
      const check = validarCuitModulo11(val);
      if (check.valid) {
        fiscalCuitValidationMsg.innerHTML = '<span style="color: #10b981; font-weight: 500;">✓ CUIT válido</span>';
      } else if (val.replace(/\D/g, "").length >= 11) {
        fiscalCuitValidationMsg.innerHTML = `<span style="color: #ef4444;">⚠ ${check.error}</span>`;
      } else {
        fiscalCuitValidationMsg.innerHTML = '<span style="color: #64748b;">Ingrese los 11 dígitos</span>';
      }
    });
  }

  async function cargarConfigFiscal() {
    if (!formConfigFiscal) return;

    try {
      const res = await authFetch(`/api/ajustes/fiscal/${cid}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.cuit) fiscalCuitInput.value = data.cuit;
      if (data.punto_venta) fiscalPtoVtaInput.value = data.punto_venta;
      if (data.condicion_iva) fiscalCondicionIvaSelect.value = data.condicion_iva;
      if (data.ambiente) fiscalAmbienteSelect.value = data.ambiente;

      // Badge Certificado
      if (data.certificado_cargado) {
        badgeCertStatus.textContent = "Cargado ✓";
        badgeCertStatus.style.background = "#dcfce7";
        badgeCertStatus.style.color = "#15803d";
      } else {
        badgeCertStatus.textContent = "Sin cargar";
        badgeCertStatus.style.background = "#fee2e2";
        badgeCertStatus.style.color = "#dc2626";
      }

      // Badge Clave Privada
      if (data.clave_privada_cargada) {
        badgeKeyStatus.textContent = "Cargada ✓";
        badgeKeyStatus.style.background = "#dcfce7";
        badgeKeyStatus.style.color = "#15803d";
      } else {
        badgeKeyStatus.textContent = "Sin cargar";
        badgeKeyStatus.style.background = "#fee2e2";
        badgeKeyStatus.style.color = "#dc2626";
      }

      // Vencimiento
      if (data.vencimiento_certificado) {
        const vDate = new Date(data.vencimiento_certificado);
        const vStr = vDate.toLocaleDateString("es-AR", { year: "numeric", month: "2-digit", day: "2-digit" });
        if (data.expirado) {
          fiscalCertVencimiento.innerHTML = `<strong style="color: #ef4444;">⚠ Venció el ${vStr}</strong>`;
        } else {
          fiscalCertVencimiento.innerHTML = `Vence: ${vStr}`;
        }
      } else {
        fiscalCertVencimiento.textContent = "";
      }

      // Badge global estado
      if (data.configurado && !data.expirado) {
        badgeEstadoFiscal.textContent = "Listo para operar ✓";
        badgeEstadoFiscal.style.background = "#dcfce7";
        badgeEstadoFiscal.style.color = "#15803d";
      } else if (data.expirado) {
        badgeEstadoFiscal.textContent = "Certificado Vencido ⚠";
        badgeEstadoFiscal.style.background = "#fee2e2";
        badgeEstadoFiscal.style.color = "#dc2626";
      } else {
        badgeEstadoFiscal.textContent = "Incompleto";
        badgeEstadoFiscal.style.background = "#fef9c3";
        badgeEstadoFiscal.style.color = "#854d0e";
      }
    } catch (e) {
      console.warn("No se pudo cargar la configuración fiscal:", e);
    }
  }

  function leerArchivoTexto(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Error leyendo archivo: " + e.target.error));
      reader.readAsText(file);
    });
  }

  if (formConfigFiscal) {
    formConfigFiscal.addEventListener("submit", async (e) => {
      e.preventDefault();

      const cuit = fiscalCuitInput.value.trim();
      const val = validarCuitModulo11(cuit);
      if (!val.valid) {
        alert(`El CUIT ingresado no es válido: ${val.error}`);
        fiscalCuitInput.focus();
        return;
      }

      const originalBtnText = btnGuardarFiscal.innerHTML;
      btnGuardarFiscal.innerHTML = "Guardando...";
      btnGuardarFiscal.disabled = true;
      fiscalFeedbackMsg.innerHTML = '<span style="color: #3b82f6;">Procesando y almacenando certificados...</span>';

      try {
        let certText = null;
        let keyText = null;

        if (fiscalCertFile.files && fiscalCertFile.files[0]) {
          certText = await leerArchivoTexto(fiscalCertFile.files[0]);
        }
        if (fiscalKeyFile.files && fiscalKeyFile.files[0]) {
          keyText = await leerArchivoTexto(fiscalKeyFile.files[0]);
        }

        const payload = {
          comercio_id: cid,
          cuit: val.formatted,
          punto_venta: parseInt(fiscalPtoVtaInput.value, 10) || 1,
          condicion_iva: fiscalCondicionIvaSelect.value,
          ambiente: fiscalAmbienteSelect.value,
          certificado_texto: certText || undefined,
          clave_privada_texto: keyText || undefined,
        };

        const res = await authFetch("/api/ajustes/fiscal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al guardar configuración fiscal");

        fiscalFeedbackMsg.innerHTML = '<span style="color: #10b981;">✓ Configuración fiscal guardada con éxito</span>';
        alert("✅ Configuración fiscal guardada correctamente.");

        // Limpiar inputs de archivo
        fiscalCertFile.value = "";
        fiscalKeyFile.value = "";

        await cargarConfigFiscal();
      } catch (err) {
        fiscalFeedbackMsg.innerHTML = `<span style="color: #ef4444;">❌ Error: ${err.message}</span>`;
        alert(`❌ Error: ${err.message}`);
      } finally {
        btnGuardarFiscal.innerHTML = originalBtnText;
        btnGuardarFiscal.disabled = false;
      }
    });
  }

  if (btnTestAfip) {
    btnTestAfip.addEventListener("click", async () => {
      const originalText = btnTestAfip.innerHTML;
      btnTestAfip.innerHTML = "Conectando...";
      btnTestAfip.disabled = true;

      try {
        const res = await authFetch("/api/ajustes/fiscal/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comercio_id: cid })
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          alert(`❌ No se pudo conectar con AFIP/ARCA:\n${data.message || data.error || "Error desconocido"}`);
        } else {
          const s = data.servidores || {};
          alert(
            `✅ Conexión con AFIP/ARCA exitosa!\n\n` +
            `Ambiente: ${data.ambiente}\n` +
            `CUIT: ${data.cuit}\n` +
            `Punto de Venta: ${data.punto_venta}\n` +
            `Vencimiento Certificado: ${data.vencimiento ? new Date(data.vencimiento).toLocaleDateString("es-AR") : "N/D"}\n\n` +
            `Estado de Servidores:\n` +
            `• AppServer: ${s.appserver || "OK"}\n` +
            `• DbServer: ${s.dbserver || "OK"}\n` +
            `• AuthServer: ${s.authserver || "OK"}`
          );
        }
      } catch (err) {
        alert(`❌ Error al probar conexión: ${err.message}`);
      } finally {
        btnTestAfip.innerHTML = originalText;
        btnTestAfip.disabled = false;
      }
    });
  }

  // Cargar configuración fiscal al inicializar
  cargarConfigFiscal();
});