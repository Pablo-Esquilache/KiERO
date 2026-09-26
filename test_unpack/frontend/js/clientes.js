;
import { escapeHtml } from "./utils/escapeHtml.js";
import { ComercioAPI, ClientesAPI, HistorialAPI, VentasAPI, DevolucionesAPI } from "./api.js";

// ===========================================================
// SESIÓN / COMERCIO
// ===========================================================
const session = JSON.parse(localStorage.getItem("session"));
const firebaseUID = session?.uid;
let comercioId = session?.comercio_id || null;

// ===========================================================
// DOM
// ===========================================================
const buscarCliente = document.getElementById("c-buscar");
const filtroLocalidad = document.getElementById("c-filtro-localidad");
const btnNuevoCliente = document.getElementById("c-btn-nuevo");
const btnLimpiarFiltros = document.getElementById("c-btn-limpiar");

const modalCliente = document.getElementById("app-modal");
const btnCerrarModal = document.querySelector(".app-close");
const tituloModal = document.querySelector(".app-subtitle");

const campoId = document.getElementById("idCliente");
const campoNombre = document.getElementById("nombre");
const campoFechaNacimiento = document.getElementById("fechaNacimiento");
const campoGenero = document.getElementById("genero");
const campoTelefono = document.getElementById("telefono");
const campoEmail = document.getElementById("email");
const campoLocalidad = document.getElementById("localidad");
const campoNuevaLocalidad = document.getElementById("nuevaLocalidad");
const campoComentarios = document.getElementById("comentarios");
const btnNuevaLocalidad = document.getElementById("btnNuevaLocalidad");

const tablaClientesBody = document.getElementById("tablaClientes");

const modalDetalle = document.getElementById("app-modal-detalle");
const tablaDetalleBody = document.getElementById("tablaDetalleBody");
const detalleTotal = document.getElementById("detalleTotal");
const btnCerrarDetalle = document.querySelector(".app-close-detalle");

// ---- Modal Historial
const modalHistorial = document.getElementById("app-modal-historial");
const tablaHistorialBody = document.getElementById("tablaHistorialBody");
const btnCerrarHistorial = document.querySelector(".app-close-historial");
let historialActual = [];
let clienteActualHistorial = null;

const modalPago = document.getElementById("app-modal-pago");
const btnRegistrarPagoHistorial = document.getElementById("btnRegistrarPagoHistorial");
const btnCerrarModalPago = document.getElementById("btnCerrarModalPago");
const ccRegistrarPago = document.getElementById("ccRegistrarPago");
const ccMontoPago = document.getElementById("ccMontoPago");

// ===========================================================
// ESTADO
// ===========================================================
let modoEdicion = false;
let clienteEditandoId = null;
let clientes = [];
let localidades = [];
let detalleActual = [];
let ventaActualDetalle = null;

// ===========================================================
// HELPERS
// ===========================================================
function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const m = hoy.getMonth() - nacimiento.getMonth();

  if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
}

// ===========================================================
// CARGAR COMERCIO
// ===========================================================
async function cargarComercio() {
  if (!firebaseUID) return;

  const data = await ComercioAPI.getByUid(firebaseUID);
  comercioId = data.id;
}

// ===========================================================
// CARGAR CLIENTES
// ===========================================================
async function cargarClientes() {
  if (!comercioId) return;

  clientes = await ClientesAPI.getAll(comercioId);

  renderTablaClientes();
  await cargarLocalidades();
}

// ===========================================================
// CARGAR LOCALIDADES
// ===========================================================
async function cargarLocalidades() {
  if (!comercioId) return;

  localidades = await ClientesAPI.getLocalidades(comercioId);

  filtroLocalidad.innerHTML = `<option value="">Todas las localidades</option>`;
  campoLocalidad.innerHTML = `<option value="">Seleccionar localidad</option>`;

  localidades.forEach((loc) => {
    filtroLocalidad.innerHTML += `<option value="${loc}">${loc}</option>`;
    campoLocalidad.innerHTML += `<option value="${loc}">${loc}</option>`;
  });
}

// ===========================================================
// MODAL CLIENTE
// ===========================================================
btnNuevoCliente.addEventListener("click", () => {
  modoEdicion = false;
  clienteEditandoId = null;
  tituloModal.textContent = "Nuevo cliente";
  limpiarFormulario();
  mostrarInputNuevaLocalidad(false);

  document.getElementById("fila-id-cliente").style.display = "none";
  modalCliente.style.display = "flex";
});

btnCerrarModal.addEventListener("click", () => {
  modalCliente.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modalCliente) modalCliente.style.display = "none";
});

// ===========================================================
// FORM
// ===========================================================
function limpiarFormulario() {
  campoId.value = "";
  campoNombre.value = "";
  campoFechaNacimiento.value = "";
  campoGenero.value = "";
  campoTelefono.value = "";
  campoEmail.value = "";
  campoLocalidad.value = "";
  campoNuevaLocalidad.value = "";
  campoComentarios.value = "";
}

function mostrarInputNuevaLocalidad(mostrar) {
  if (mostrar) {
    campoNuevaLocalidad.style.display = "block";
    campoLocalidad.style.display = "none";
  } else {
    campoNuevaLocalidad.style.display = "none";
    campoLocalidad.style.display = "inline-block";
    campoNuevaLocalidad.value = "";
  }
}

btnNuevaLocalidad.addEventListener("click", () =>
  mostrarInputNuevaLocalidad(true),
);

// ===========================================================
// GUARDAR CLIENTE
// ===========================================================
document.getElementById("formCliente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const localidadFinal =
    campoNuevaLocalidad.value.trim() || campoLocalidad.value;

  const data = {
    nombre: campoNombre.value.trim(),
    fecha_nacimiento: campoFechaNacimiento.value || null,
    genero: campoGenero.value || "",
    telefono: campoTelefono.value.trim() || "",
    email: campoEmail.value.trim() || "",
    localidad: localidadFinal || "",
    comentarios: campoComentarios.value.trim() || "",
    comercio_id: comercioId,
  };

  try {
    if (!modoEdicion) {
      await ClientesAPI.create(data);
    } else {
      await ClientesAPI.update(clienteEditandoId, data);
    }
  } catch (err) {
    alert(err.message || "Error al guardar el cliente.");
  }

  modalCliente.style.display = "none";
  await cargarClientes();
});

// ===========================================================
// FILTROS
// ===========================================================
buscarCliente.addEventListener("input", renderTablaClientes);
filtroLocalidad.addEventListener("change", renderTablaClientes);

btnLimpiarFiltros.addEventListener("click", () => {
  buscarCliente.value = "";
  filtroLocalidad.value = "";
  renderTablaClientes();
});

// ===========================================================
// TABLA
// ===========================================================
function renderTablaClientes() {
  const texto = buscarCliente.value.toLowerCase();
  const localidadSeleccionada = filtroLocalidad.value;

  const filtrados = clientes.filter((c) => {
    const okNombre = c.nombre.toLowerCase().includes(texto);
    const okLocalidad =
      !localidadSeleccionada || c.localidad === localidadSeleccionada;
    return okNombre && okLocalidad;
  });

  tablaClientesBody.innerHTML = "";

  filtrados.forEach((c) => {
    tablaClientesBody.innerHTML += `
      <tr>
        <td class="cliente-nombre-cell">
          <button class="btn-nombre-cliente" onclick="verHistorialCliente(${c.id}, '${escapeQuote(c.nombre)}')">
            ${escapeHtml(c.nombre)}
          </button>
        </td>
        <td>${calcularEdad(c.fecha_nacimiento) ?? "-"}</td>
        <td>${c.genero || "-"}</td>
        <td>${escapeHtml(c.telefono) || "-"}</td>
        <td>${escapeHtml(c.email) || "-"}</td>
        <td>${escapeHtml(c.localidad) || "-"}</td>
        <td>${c.comentarios || "-"}</td>
        <td>
          <div class="acciones-clientes">
            <button class="btn-editar" data-id="${c.id}">Editar</button>
            <button class="app-btn-historial only-admin" data-id="${c.id}">
              Historial
            </button>
            ${Math.abs(Number(c.saldo || 0)) > 0.01 ? '<span class="cc-dot"></span>' : ""}
          </div>
        </td>
      </tr>
    `;
  });

  document
    .querySelectorAll(".btn-editar")
    .forEach((b) =>
      b.addEventListener("click", () => editarCliente(b.dataset.id)),
    );

  document
    .querySelectorAll(".app-btn-historial")
    .forEach((b) =>
      b.addEventListener("click", () => verHistorial(b.dataset.id)),
    );
}

// ===========================================================
// EDITAR CLIENTE
// ===========================================================
function editarCliente(id) {
  const c = clientes.find((x) => x.id == id);
  if (!c) return;

  modoEdicion = true;
  clienteEditandoId = id;

  tituloModal.textContent = "Editar cliente";
  document.getElementById("fila-id-cliente").style.display = "block";

  campoId.value = c.id;
  campoNombre.value = c.nombre;
  if (c.fecha_nacimiento) {
    const d = new Date(c.fecha_nacimiento);
    campoFechaNacimiento.value = new Date(d - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
  } else {
    campoFechaNacimiento.value = "";
  }
  campoGenero.value = c.genero ?? "";
  campoTelefono.value = c.telefono ?? "";
  campoEmail.value = c.email ?? "";

  if (localidades.includes(c.localidad)) {
    mostrarInputNuevaLocalidad(false);
    campoLocalidad.value = c.localidad;
  } else {
    mostrarInputNuevaLocalidad(true);
    campoNuevaLocalidad.value = c.localidad;
  }

  campoComentarios.value = c.comentarios ?? "";
  modalCliente.style.display = "flex";
}

// ===========================================================
// HISTORIAL CLIENTE
// ===========================================================

async function verHistorial(clienteId) {
  const role = session?.role;
  if (role !== "admin") {
    alert("No tenés permisos para ver el historial");
    return;
  }

  tablaHistorialBody.innerHTML = "<tr><td colspan='5'>Cargando...</td></tr>";
  document.getElementById("resumenHistorial").innerHTML = "";

  try {
    // 1️⃣ Ventas y Devoluciones
    const ventas = await HistorialAPI.getVentasPorCliente(clienteId, comercioId);
    let devoluciones = [];
    let pagos = [];
    try {
      const allDevoluciones = await DevolucionesAPI.getAll(comercioId);
      devoluciones = allDevoluciones.filter(d => d.cliente_id == clienteId);
    } catch(e) { console.warn("Error cargando devoluciones"); }
    
    try {
      const ccData = await ClientesAPI.getCuentaCorriente(clienteId, comercioId);
      pagos = ccData.filter(m => m.tipo === 'pago');
    } catch(e) { console.warn("Error cargando pagos"); }

    historialActual = ventas;
    clienteActualHistorial = clienteId;

    // 2️⃣ Saldo
    const dataSaldo = await ClientesAPI.getSaldo(clienteId, comercioId);
    const saldo = Number(dataSaldo.saldo);

    // 3️⃣ Unificar y ordenar movimientos (Ventas + Devoluciones)
    let movimientos = [];
    ventas.forEach(v => movimientos.push({...v, tipo_operacion: 'venta'}));
    devoluciones.forEach(d => movimientos.push({...d, tipo_operacion: 'devolucion', metodo_pago: 'A Favor'}));
    pagos.forEach(p => movimientos.push({...p, fecha: p.created_at, tipo_operacion: 'pago', metodo_pago: 'Efectivo', total: p.monto}));
    movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // 4️⃣ Matemática
    let totalEfectivo = 0;
    let totalDigital = 0;
    let totalDevoluciones = 0;
    let totalOperatoria = 0;

    ventas.forEach(v => {
      const vTot = Number(v.total);
      totalOperatoria += vTot;
      if (v.metodo_pago === 'Efectivo') {
        totalEfectivo += vTot;
      } else if (v.metodo_pago !== 'Cuenta Corriente') {
        totalDigital += vTot;
      }
    });
    devoluciones.forEach(d => {
      totalDevoluciones += Number(d.total);
    });

    // 5️⃣ Render Resumen
    let saldoHtml = '';
    if (saldo > 0) {
      saldoHtml = `<strong style="color: #e53935; font-size: 16px;">$ ${saldo.toFixed(2)} (DEUDA)</strong>`;
    } else if (saldo < 0) {
      saldoHtml = `<strong style="color: #43a047; font-size: 16px;">$ ${Math.abs(saldo).toFixed(2)} (A FAVOR)</strong>`;
    } else {
      saldoHtml = `<strong style="font-size: 16px;">$ 0.00 (AL DÍA)</strong>`;
    }

    document.getElementById("resumenHistorial").innerHTML = `
      <div class="caja-card" style="border-left: 4px solid #10b981; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Efectivo</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ ${totalEfectivo.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid #3b82f6; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Digitales</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ ${totalDigital.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid #f59e0b; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Devoluciones</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ ${totalDevoluciones.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid #6366f1; padding: 10px; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Total Operatoria</span><br/>
        <strong style="font-size: 16px; color: #1e293b;">$ ${totalOperatoria.toFixed(2)}</strong>
      </div>
      <div class="caja-card" style="border-left: 4px solid ${saldo > 0 ? '#e53935' : (saldo < 0 ? '#43a047' : '#94a3b8')}; padding: 10px; background: ${saldo > 0 ? '#ffebee' : (saldo < 0 ? '#e8f5e9' : '#f8fafc')}; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 6px;">
        <span style="font-size: 12px; color: #64748b;">Cuenta Corriente</span><br/>
        ${saldoHtml}
      </div>
    `;

        // 6️⃣ Render Tabla
    tablaHistorialBody.innerHTML = "";
    
    // NOMBRES:
    const cliObj = clientes.find(c => c.id == clienteId);
    const nombreHeader = cliObj ? cliObj.nombre : "Cliente";
    const tituloHistorial = document.getElementById("tituloHistorialCliente");
    if (tituloHistorial) tituloHistorial.textContent = "Historial de " + nombreHeader;

    if (!movimientos.length) {
      tablaHistorialBody.innerHTML = "<tr><td colspan='5'>Sin movimientos registrados</td></tr>";
    } else {
      movimientos.forEach(m => {
        const isVenta = m.tipo_operacion === 'venta';
        const isPago = m.tipo_operacion === 'pago';
        
        let labelOperacion = '';
        let colorOperacion = '';
        let prefijoMonto = '';
        let colorMonto = '';
        
        if (isVenta) {
          labelOperacion = 'Venta';
          colorOperacion = '#1e293b';
          prefijoMonto = '';
          colorMonto = '#1e293b';
        } else if (isPago) {
          labelOperacion = 'Pago de Deuda';
          colorOperacion = '#10b981';
          prefijoMonto = '+';
          colorMonto = '#10b981';
        } else {
          labelOperacion = 'Devolución';
          colorOperacion = '#f59e0b';
          prefijoMonto = '-';
          colorMonto = '#f59e0b';
        }

        tablaHistorialBody.innerHTML += `
          <tr>
            <td>${formatearFecha(m.fecha)}</td>
            <td><span style="color:${colorOperacion}; font-weight:500;">${labelOperacion}</span></td>
            <td>${m.metodo_pago}</td>
            <td style="color:${colorMonto}; font-weight:bold;">${prefijoMonto}$${Number(m.total).toFixed(2)}</td>
            <td>
              ${isVenta ? `<button class="btn-ver-detalle" data-id="${m.id}">Ver Tique</button>` : '-'}
            </td>
          </tr>
        `;
      });
      document.querySelectorAll(".btn-ver-detalle").forEach((b) =>
        b.addEventListener("click", () => verDetalleVenta(b.dataset.id))
      );
    }

    modalHistorial.style.display = "flex";
  } catch (error) {
    console.error(error);
    alert("Error cargando historial");
  }
}

async function verDetalleVenta(ventaId) {
  try {
    const data = await VentasAPI.getDetalle(ventaId);
    
    // Obtenemos info del historial para mostrar en cabecera
    const infoVenta = historialActual.find((v) => v.id == ventaId);

    if (infoVenta) {
      document.getElementById("ticketIdDetalle").textContent = infoVenta.id;
      document.getElementById("ticketFechaDetalle").textContent = formatearFecha(infoVenta.fecha);
      document.getElementById("ticketMetodoDetalle").textContent = infoVenta.metodo_pago;
    }

    // Cabecera Cliente en Ticket
    const cliObj = clientes.find(c => c.id == clienteActualHistorial);
    const nombreCli = cliObj ? cliObj.nombre : "Consumidor Final";
    document.getElementById("ticketNombreCli").textContent = nombreCli;

    tablaDetalleBody.innerHTML = "";
    let total = 0;

    if (!data.length) {
      tablaDetalleBody.innerHTML = "<div style='text-align:center;'>Sin detalle disponible</div>";
    } else {
      data.forEach((item) => {
        total += Number(item.subtotal);

        tablaDetalleBody.innerHTML += `
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold; font-size: 13px;">${item.producto_nombre || "Producto sin nombre"}</div>
            <div style="display: flex; justify-content: space-between; color: #555; font-size: 13px;">
              <span>${item.cantidad} x $${Number(item.precio_unitario).toFixed(2)}</span>
              <span>$${Number(item.subtotal).toFixed(2)}</span>
            </div>
          </div>
        `;
      });
    }

    detalleActual = data;
    ventaActualDetalle = ventaId;

    detalleTotal.textContent = total.toFixed(2);

    modalDetalle.style.display = "flex";
  } catch (error) {
    console.error(error);
    alert("Error inesperado al cargar el detalle");
  }
}

document
  .getElementById("btnDescargarResumen")
  .addEventListener("click", () => {
    if (!historialActual.length) {
      alert("No hay datos para exportar");
      return;
    }

    const dataExcel = historialActual.map((v) => ({
      Fecha: formatearFecha(v.fecha),
      "ID Venta": v.id,
      "Método de Pago": v.metodo_pago,
      Total: Number(v.total),
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historial");

    XLSX.writeFile(wb, `historial_cliente_${clienteActualHistorial}.xlsx`);
  });



btnCerrarHistorial.addEventListener("click", () => {
  modalHistorial.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modalHistorial) modalHistorial.style.display = "none";
});

btnCerrarDetalle.addEventListener("click", () => {
  modalDetalle.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modalDetalle) modalDetalle.style.display = "none";
});




btnRegistrarPagoHistorial.addEventListener("click", () => {
  ccMontoPago.value = "";
  modalPago.style.display = "flex";
});

btnCerrarModalPago.addEventListener("click", () => {
  modalPago.style.display = "none";
});

ccRegistrarPago.addEventListener("click", async () => {
  const monto = Number(ccMontoPago.value);
  if (!monto || monto <= 0) {
    alert("Monto inválido");
    return;
  }
  
  if (!clienteActualHistorial) return;

  try {
    await ClientesAPI.registrarPago(clienteActualHistorial, { comercio_id: comercioId, monto });
    alert("Pago registrado con éxito");
    ccMontoPago.value = "";
    modalPago.style.display = "none";
    // Refrescar historial
    await verHistorial(clienteActualHistorial);
    await cargarClientes();
  } catch(e) {
    alert("Error al registrar pago");
  }
});

function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";

  const fecha = new Date(fechaISO);

  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const año = fecha.getFullYear();

  return `${dia}/${mes}/${año}`;
}

// ===========================================================
// INIT
// ===========================================================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarComercio();

  if (comercioId) {
    await cargarClientes();
  } else {
    console.error("No se pudo obtener comercioId");
  }
});

function escapeQuote(str) {
  if (!str) return "";
  return str.replace(/'/g, "\\'");
}

// Imprimir ticket historial
document.getElementById("btnImprimirTicketHistorial")?.addEventListener("click", () => {
  const contenido = document.getElementById("ticketContenidoImprimir").innerHTML;
  const ventana = window.open('', '_blank', 'width=300,height=500');
  ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
  ventana.document.write(contenido);
  ventana.document.write('</body></html>');
  ventana.document.close();
  ventana.onload = () => {
    ventana.print();
    ventana.close();
  };
})