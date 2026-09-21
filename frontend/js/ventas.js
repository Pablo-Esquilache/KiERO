import {
  VentasAPI,
  ComercioAPI,
  ClientesAPI,
  ProductosAPI,
  DevolucionesAPI,
  CajasAPI,
} from "./api.js";

// ==============================
// SESIÓN / COMERCIO
// ==============================
const session = JSON.parse(localStorage.getItem("session"));
const firebaseUID = session?.uid;
let comercioId = session?.comercio_id || null;


// ==============================
// BLOQUEO DE VENTAS SIN CAJA ABIERTA
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
    if (comercioId) {
        try {
            const cajaActual = await CajasAPI.getHoy(comercioId);
            if (!cajaActual || cajaActual.estado !== "abierta") {
                const posHeader = document.querySelector(".pos-header");
                const posContainer = document.getElementById("pos-container");
                const historyContainer = document.getElementById("history-container");
                const btnToggleVista = document.getElementById("btnToggleVista");
                
                if (posHeader) posHeader.style.display = "none";
                if (posContainer) posContainer.style.display = "none";
                if (historyContainer) historyContainer.style.display = "none";
                if (btnToggleVista) btnToggleVista.style.display = "none";
                
                const overlay = document.createElement("div");
                overlay.innerHTML = `
                  <div style="text-align: center; padding: 100px 20px; background: rgba(0,0,0,0.05); border-radius: 12px; margin-top: 20px; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #e63946; font-size: 2em; margin-bottom: 20px;">⚠️ Atención: La caja está cerrada</h2>
                    <p style="font-size: 1.2em; color: #555; margin-bottom: 30px;">Debes abrir la caja del día para poder realizar ventas en el mostrador.</p>
                    <a href="caja.html" class="app-btn-primary" style="padding: 15px 30px; font-size: 1.2em; text-decoration: none; display: inline-block; border-radius: 8px;">Ir a Abrir Caja</a>
                  </div>
                `;
                
                const mainContainer = document.querySelector(".app-container");
                if (mainContainer) {
                    mainContainer.appendChild(overlay);
                }
                
                // Also grey out the active nav item
                const navItem = document.querySelector(".app-navbar-menu a.app-active");
                if (navItem) {
                    navItem.style.backgroundColor = "#555";
                    navItem.style.color = "#ccc";
                    navItem.innerHTML = "Ventas 🔒";
                }
            }
        } catch (err) {
            console.error("Error al verificar estado de caja para bloqueo:", err);
        }
    }
});

// --- GLOBAL STATE FOR MODALS ---
let allClientes = [];
let modalVisibleCount = 20;

let ventasVisibleCount = 15;
let currentFilteredVentas = [];

let currentFilteredClientes = [];

const renderClientesBuscadorLazy = (append = false) => {
  const tabla = document.getElementById("tablaClientesBuscadorBody");
  if (!tabla) return;
  if (!append) {
    tabla.innerHTML = "";
  }
  const limit = Math.min(modalVisibleCount, currentFilteredClientes.length);
  const startIndex = append ? modalVisibleCount - 20 : 0;
  for (let i = startIndex; i < limit; i++) {
    const c = currentFilteredClientes[i];
    const tr = document.createElement("tr");
    tr.style.cursor = "pointer";
    tr.innerHTML = `
      <td>${c.nombre}</td>
      <td>${c.telefono || "-"}</td>
      <td>${c.email || "-"}</td>
    `;
    tr.addEventListener("click", () => {
      document.getElementById("clienteVenta").value = c.id;
      document.getElementById("clienteVentaNombre").value = c.nombre;
      document.getElementById("modalBuscarCliente").style.display = "none";
    });
    tabla.appendChild(tr);
  }
};


async function cargarComercio() {
  if (!firebaseUID) return;
  const data = await ComercioAPI.getByUid(firebaseUID);
  comercioId = data.id;
}

// ==============================
// REFERENCIAS DOM
// ==============================
const btnNuevaVenta = document.getElementById("btnNuevaVenta");
const modalVenta = document.getElementById("modalVenta");
const btnCerrarModal = document.querySelector("#modalVenta .app-close");

const btnVerVentas = document.getElementById("btnVerVentas");
const modalVerVentas = document.getElementById("modalVerVentas");
const btnCerrarVer = document.querySelector("#modalVerVentas .app-close-ver");

const tablaVentasBody = document.getElementById("tablaVentasBody");
const tablaVerVentasBody = document.getElementById("tablaVerVentasBody");

const fechaVenta = document.getElementById("fechaVenta");
const clienteVenta = document.getElementById("clienteVenta");
const productoVenta = document.getElementById("productoVenta");
const barcodeVenta = document.getElementById("barcodeVenta");
const cantidadVenta = document.getElementById("cantidadVenta");
const btnAgregarProducto = document.getElementById("btnAgregarProducto");

const carritoBody = document.getElementById("carritoBody");
const subtotalVenta = document.getElementById("subtotalVenta");
const descuentoVenta = document.getElementById("descuentoVenta");
const metodoPagoVenta = document.getElementById("metodoPagoVenta");
const totalFinalVenta = document.getElementById("totalFinalVenta");

const formVenta = document.querySelector(".app-form-venta");

const btnDevolucion = document.getElementById("btnDevolucion");
const modalDevolucion = document.getElementById("modalDevolucion");
const cerrarModalDevolucion = document.getElementById("cerrarModalDevolucion");

const modalProductosDevolucion = document.getElementById(
  "modalProductosDevolucion",
);
const cerrarModalProductosDevolucion = document.getElementById(
  "cerrarModalProductosDevolucion",
);

const clienteDevolucion = document.getElementById("clienteDevolucion");
const btnBuscarVentasCliente = document.getElementById(
  "btnBuscarVentasCliente",
);
const tablaVentasClienteBody = document.getElementById(
  "tablaVentasClienteBody",
);

const tablaDetalleVentaBody = document.getElementById("tablaDetalleVentaBody");
const carritoDevolucionBody = document.getElementById("carritoDevolucionBody");
const totalDevolucionSpan = document.getElementById("totalDevolucion");
const btnConfirmarDevolucion = document.getElementById(
  "btnConfirmarDevolucion",
);

// Filtros principal
const buscarVenta = document.getElementById("buscarVenta");
const btnLimpiarFiltros = document.getElementById("btnLimpiarFiltros");

// Filtros modal
const buscarVentaModal = document.getElementById("buscarVentaModal");
const filtroDesdeModal = document.getElementById("filtroDesdeModal");
const filtroHastaModal = document.getElementById("filtroHastaModal");
const btnLimpiarFiltrosModal = document.getElementById(
  "btnLimpiarFiltrosModal",
);

const btnBuscarProducto = document.getElementById("btnBuscarProducto");
const modalProductos = document.getElementById("modalProductos");
const cerrarModalProductos = document.getElementById("cerrarModalProductos");
const buscarProductoModal = document.getElementById("buscarProductoModal");
const tablaProductosModalBody = document.getElementById(
  "tablaProductosModalBody",
);

const btnVerDevoluciones = document.getElementById("btnVerDevoluciones");
const modalVerDevoluciones = document.getElementById("modalVerDevoluciones");
const cerrarModalVerDevoluciones = document.getElementById(
  "cerrarModalVerDevoluciones",
);
const tablaDevolucionesBody = document.getElementById("tablaDevolucionesBody");

const modalTicketDevolucion = document.getElementById("modalTicketDevolucion");
const cerrarModalTicketDevolucion = document.getElementById(
  "cerrarModalTicketDevolucion",
);

// ==============================
// ESTADO
// ==============================
let carrito = [];
let productosCache = [];
let ventasCachePrincipal = [];
let ventasCacheModal = [];
let ventaEnEdicionId = null;
let carritoDevolucion = [];
let ventaSeleccionadaDevolucion = null;

// ==============================
// MODAL NUEVA VENTA
// ==============================
if (btnNuevaVenta) {
  btnNuevaVenta?.addEventListener("click", async () => {
    limpiarFormulario();

    // 🔹 Fecha automática hoy
    const hoy = new Date().toLocaleDateString("sv-SE");
    fechaVenta.value = hoy;
    fechaVenta.readOnly = true; // no editable

    await cargarClientes();
    await cargarProductos();
    await cargarMetodosYDescuentos();
    // modalVenta.style.display = "flex";
  });
}

if (btnCerrarModal) {
  btnCerrarModal.addEventListener("click", () => {
    modalVenta.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modalVenta) modalVenta.style.display = "none";
});

// ==============================
// LIMPIAR FORM
// ==============================
function limpiarFormulario() {
  carrito = [];
  carritoBody.innerHTML = "";
  subtotalVenta.textContent = "0.00";
  totalFinalVenta.textContent = "0.00";
  descuentoVenta.value = "0";
  cantidadVenta.value = 1;
  productoVenta.value = "";
  
  const pNombre = document.getElementById("productoVentaNombre");
  if(pNombre) pNombre.value = "";
  
  // Reseleccionar consumidor final
  if (typeof allClientes !== 'undefined' && allClientes) {
    const cf = allClientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
    const cVenta = document.getElementById("clienteVenta");
    const cVentaNombre = document.getElementById("clienteVentaNombre");
    if (cf && cVenta && cVentaNombre) {
      cVenta.value = cf.id;
      cVentaNombre.value = cf.nombre;
    } else if (cVenta && cVentaNombre) {
      cVenta.value = "";
      cVentaNombre.value = "";
    }
  }

  ventaEnEdicionId = null;
}

// ==============================
// CLIENTES
// ==============================
async function cargarClientes() {
  const clientes = await ClientesAPI.getAll(comercioId);
    
    // Auto-select Consumidor Final
    const consumidorFinal = clientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
    if (consumidorFinal) {
      document.getElementById("clienteVenta").value = consumidorFinal.id;
      document.getElementById("clienteVentaNombre").value = consumidorFinal.nombre;
    }


  // clienteVenta select disabled by refactor
  clientes.forEach((c) => {
    // option append disabled by refactor
  });
}

// ==============================
// METODOS DE PAGO Y DESCUENTOS
// ==============================
async function cargarMetodosYDescuentos() {
  try {
    const rMetodos = await fetch(`/api/ajustes/metodos_pago/${comercioId}`);
    if (rMetodos.ok) {
      const metodos = await rMetodos.json();
      const activeMethods = metodos.filter(m => m.activo);
      
      // Siempre asegurar que exista "Efectivo"
      let optionsStr = activeMethods.map(m => `<option value="${m.nombre}">${m.nombre}</option>`).join("");
      if (!optionsStr.toLowerCase().includes('value="efectivo"')) {
        optionsStr = '<option value="Efectivo">Efectivo</option>' + optionsStr;
      }
      metodoPagoVenta.innerHTML = optionsStr;
    } else {
      metodoPagoVenta.innerHTML = '<option value="Efectivo">Efectivo</option>';
    }
  } catch (err) { 
    console.error("Error cargando metodos", err);
    metodoPagoVenta.innerHTML = '<option value="Efectivo">Efectivo</option>';
  }
  metodoPagoVenta.value = "Efectivo"; // Default

  try {
    const rDescuentos = await fetch(`/api/ajustes/descuentos/${comercioId}`);
    if (rDescuentos.ok) {
      const descuentos = await rDescuentos.json();
      const activeDesc = descuentos.filter(d => d.activo);
      
      // Siempre asegurar que exista "0"
      let optionsStr = activeDesc.map(d => `<option value="${Number(d.porcentaje)}">${Number(d.porcentaje)}%</option>`).join("");
      if (!optionsStr.includes('value="0"')) {
        optionsStr = '<option value="0">0%</option>' + optionsStr;
      }
      descuentoVenta.innerHTML = optionsStr;
    } else {
      descuentoVenta.innerHTML = '<option value="0">0%</option>';
    }
  } catch (err) { 
    console.error("Error cargando descuentos", err);
    descuentoVenta.innerHTML = '<option value="0">0%</option>';
  }
  descuentoVenta.value = "0"; // Default
}


// ==============================
// PRODUCTOS
// ==============================
async function cargarProductos() {
  const productos = await ProductosAPI.getAll(comercioId);
  productosCache = productos;

  productoVenta.innerHTML = `<option value="">Seleccionar producto</option>`;
  productos.forEach((p) => {
    if (p.stock > 0) {
      productoVenta.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    }
  });
}

// ==============================
// AGREGAR AL CARRITO
// ==============================
function procesarAgregarProducto(productoId, cantidadAgregada) {
  const producto = productosCache.find((p) => p.id == productoId);
  if (!producto) return;

  const stockDisponible = Number(producto.stock);

  // 🔎 Ver cuánto ya está en carrito
  const cantidadEnCarrito = carrito
    .filter((i) => i.producto_id == productoId)
    .reduce((acc, i) => acc + i.cantidad, 0);

  const nuevaCantidadTotal = cantidadEnCarrito + cantidadAgregada;

  if (nuevaCantidadTotal > stockDisponible) {
    alert(`Stock insuficiente. Disponible en total: ${stockDisponible}`);
    return;
  }

  const itemExistente = carrito.find((i) => i.producto_id == productoId);
  if (itemExistente) {
    itemExistente.cantidad += cantidadAgregada;
    itemExistente.subtotal = itemExistente.precio_unitario * itemExistente.cantidad;
  } else {
    const precio = Number(producto.precio);
    carrito.push({
      producto_id: producto.id,
      nombre: producto.nombre,
      cantidad: cantidadAgregada,
      precio_unitario: precio,
      subtotal: precio * cantidadAgregada,
    });
  }

  renderCarrito();
}

if (btnAgregarProducto) {
  btnAgregarProducto.addEventListener("click", () => {
    const productoId = productoVenta.value;
    const cantidad = Number(cantidadVenta.value);

    if (!productoId || cantidad <= 0) return;

    procesarAgregarProducto(productoId, cantidad);

    productoVenta.value = "";
    cantidadVenta.value = 1;
    const pNombre = document.getElementById("productoVentaNombre");
    if (pNombre) pNombre.value = "";
  });
}

if (barcodeVenta) {
  barcodeVenta.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const code = barcodeVenta.value.trim();
      if (!code) return;

      const producto = productosCache.find((p) => p.codigo_barras && p.codigo_barras.trim() === code);
      
      if (!producto) {
        alert("Producto no encontrado con ese código.");
        barcodeVenta.value = "";
        return;
      }

      // Add 1 by default when scanning
      procesarAgregarProducto(producto.id, 1);
      
      barcodeVenta.value = "";
      barcodeVenta.focus();
    }
  });
}

// ==============================
function renderCarrito() {
  carritoBody.innerHTML = "";

  carrito.forEach((item, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>
        <input type="number" min="1" class="app-input cantidad-carrito" data-index="${index}" value="${item.cantidad}" style="width: 70px; padding: 4px;">
      </td>
      <td>$${item.precio_unitario.toFixed(2)}</td>
      <td>$${item.subtotal.toFixed(2)}</td>
      <td>
        <button data-index="${index}" class="btn-eliminar-item">🗑</button>
      </td>
    `;
    carritoBody.appendChild(fila);
  });

  // Eventos para eliminar productos
  document.querySelectorAll(".btn-eliminar-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      carrito.splice(btn.dataset.index, 1);
      renderCarrito();
    });
  });

  // Eventos para cambiar la cantidad directamente
  document.querySelectorAll(".cantidad-carrito").forEach((input) => {
    input.addEventListener("change", (e) => {
      let nuevaCant = parseInt(e.target.value);
      if (isNaN(nuevaCant) || nuevaCant < 1) {
        nuevaCant = 1;
        e.target.value = 1;
      }
      
      const index = e.target.dataset.index;
      const item = carrito[index];
      
      // Chequeo de stock básico
      const producto = productosCache.find((p) => p.id == item.producto_id);
      if (producto) {
        const stockDisponible = Number(producto.stock);
        const cantidadOtros = carrito
          .filter((i, idx) => i.producto_id == item.producto_id && idx != index)
          .reduce((acc, i) => acc + i.cantidad, 0);
          
        const nuevaCantidadTotal = cantidadOtros + nuevaCant;
        
        if (!ventaEnEdicionId && nuevaCantidadTotal > stockDisponible) {
          alert(`Stock insuficiente. Disponible en total: ${stockDisponible}`);
          nuevaCant = Math.max(1, stockDisponible - cantidadOtros);
          e.target.value = nuevaCant;
        }
      }

      item.cantidad = nuevaCant;
      item.subtotal = item.precio_unitario * nuevaCant;
      renderCarrito(); // Re-render para actualizar subtotales
    });
  });

  calcularTotales();
}

// ==============================
function calcularTotales() {
  const subtotal = carrito.reduce((acc, i) => acc + i.subtotal, 0);
  const descuentoPorc = Number(descuentoVenta.value) || 0;
  const total = subtotal - (subtotal * descuentoPorc) / 100;

  subtotalVenta.textContent = subtotal.toFixed(2);
  totalFinalVenta.textContent = total.toFixed(2);
}

if (descuentoVenta) {
  descuentoVenta.addEventListener("change", calcularTotales);
}

// ==============================
// GUARDAR VENTA
// ==============================
if (formVenta) {
  formVenta?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (carrito.length === 0) {
      alert("Debe agregar al menos un producto.");
      return;
    }

    const payload = {
      fecha: fechaVenta.value,
      cliente_id: clienteVenta.value,
      metodo_pago: metodoPagoVenta.value,
      descuento_porcentaje: Number(descuentoVenta.value),
      comercio_id: comercioId,
      items: carrito.map((i) => ({
        producto_id: i.producto_id,
        cantidad: i.cantidad,
        precio_unitario: i.precio_unitario,
      })),
    };

    try {
      if (ventaEnEdicionId) {
        await VentasAPI.update(ventaEnEdicionId, payload);
      } else {
        await VentasAPI.create(payload);
      }
      
      // Show ticket
      const modalTicketExito = document.getElementById("modalTicketExito");
      if (modalTicketExito) {
        const ticketContent = document.getElementById("ticketExitoContenido");
        if (ticketContent) {
            const clienteName = document.getElementById("clienteVentaNombre")?.value || "Consumidor Final";
            let itemsHtml = "";
            for(let i of carrito) {
                itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>${i.cantidad}x ${i.nombre}</span><span>${i.subtotal.toFixed(2)}</span></div>`;
            }
            const sub = carrito.reduce((acc, i) => acc + i.subtotal, 0);
            const desc = Number(descuentoVenta.value) || 0;
            const tot = sub - (sub * desc / 100);
            const pago = metodoPagoVenta.value;
            
            ticketContent.innerHTML = `
                <div style="margin-bottom: 5px;"><strong>Cliente:</strong> ${clienteName}</div>
                <div style="margin-bottom: 5px;"><strong>Mtodo de pago:</strong> ${pago}</div>
                <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
                ${itemsHtml}
                <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
                <div style="text-align: right;">Subtotal: ${sub.toFixed(2)}</div>
                <div style="text-align: right;">Descuento: ${desc}%</div>
                <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">Total: ${tot.toFixed(2)}</div>
            `;
        }
        modalTicketExito.style.display = "flex";
      }
    } catch (err) {
      alert(err.message || "Error guardando venta");
      return;
    }

    // 🔹 Reset estado
    ventaEnEdicionId = null;
    clienteVenta.disabled = false;

    modalVenta.style.display = "none";
    limpiarFormulario();
    await cargarVentas();
  });
}

// ==============================
// CARGAR VENTAS
// ==============================
async function cargarVentas() {
  const ventas = await VentasAPI.getAll(comercioId);

  const hoy = new Date();

const ventasHoy = ventas.filter((v) => {
  if (!v.fecha) return false;

  const fecha = new Date(v.fecha);

  return (
    fecha.getFullYear() === hoy.getFullYear() &&
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getDate() === hoy.getDate()
  );
});

  ventasCachePrincipal = ventasHoy;
  ventasCacheModal = ventas;

  renderVentasPrincipal(ventasHoy);
}
// ==============================

const renderVentasPrincipalLazy = (append = false) => {
  if (!tablaVentasBody) return;
  if (!append) tablaVentasBody.innerHTML = "";
  
  const limit = Math.min(ventasVisibleCount, currentFilteredVentas.length);
  const startIndex = append ? ventasVisibleCount - 15 : 0;

  for (let i = startIndex; i < limit; i++) {
    const v = currentFilteredVentas[i];
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(v.fecha)}</td>
      <td>${v.cliente_nombre || "-"}</td>
      <td>${Number(v.total_bruto).toFixed(2)}</td>
      <td>${Number(v.descuento_monto).toFixed(2)}</td>
      <td>${Number(v.total).toFixed(2)}</td>
      <td>${v.metodo_pago || "-"}</td>
      <td>
        <button class="btn-ver-ticket" data-id="${v.id}">Ver Ticket</button>
      </td>
    `;
    tablaVentasBody.appendChild(fila);
  }
  
  activarBotonesEliminar();
  activarBotonesVerTicket();
  activarBotonesEditar();
};

function renderVentasPrincipal(lista) {
  currentFilteredVentas = lista;
  ventasVisibleCount = 15;
  renderVentasPrincipalLazy(false);
}


// ==============================
// FILTROS PRINCIPAL
// ==============================
function filtrarPrincipal() {
  let lista = [...ventasCachePrincipal];

  if (buscarVenta?.value) {
    const texto = buscarVenta.value.toLowerCase();
    lista = lista.filter((v) =>
      JSON.stringify(v).toLowerCase().includes(texto),
    );
  }

  renderVentasPrincipal(lista);
}

buscarVenta?.addEventListener("input", filtrarPrincipal);

btnLimpiarFiltros?.addEventListener("click", () => {
  buscarVenta.value = "";
  renderVentasPrincipal(ventasCachePrincipal);
});

// ==============================
// MODAL VER TODAS
// ==============================
if (btnVerVentas) {
  btnVerVentas.addEventListener("click", () => {
    renderVentasModal(ventasCacheModal);
    modalVerVentas.style.display = "flex";
  });
}

if (btnCerrarVer) {
  btnCerrarVer.addEventListener("click", () => {
    modalVerVentas.style.display = "none";
  });
}

function renderVentasModal(lista) {
  tablaVerVentasBody.innerHTML = "";

  lista.forEach((v) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(v.fecha)}</td>
      <td>${v.cliente_nombre || "—"}</td>
      <td>$${Number(v.total).toFixed(2)}</td>
      <td>${v.metodo_pago || "—"}</td>
      <td>
        <button class="btn-ver-ticket" data-id="${v.id}">Ver</button>
      </td>
    `;
    tablaVerVentasBody.appendChild(fila);
  });

  activarBotonesVerTicket();
}

// ==============================
// FILTROS MODAL
// ==============================
function filtrarModal() {
  let lista = [...ventasCacheModal];

  if (buscarVentaModal?.value) {
    const texto = buscarVentaModal.value.toLowerCase();
    lista = lista.filter((v) =>
      JSON.stringify(v).toLowerCase().includes(texto),
    );
  }

  if (filtroDesdeModal?.value) {
    lista = lista.filter((v) => {
      const d = new Date(v.fecha);
      const local = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      return local >= filtroDesdeModal.value;
    });
  }

  if (filtroHastaModal?.value) {
    lista = lista.filter((v) => {
      const d = new Date(v.fecha);
      const local = new Date(d - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      return local <= filtroHastaModal.value;
    });
  }

  renderVentasModal(lista);
}

buscarVentaModal?.addEventListener("input", filtrarModal);
filtroDesdeModal?.addEventListener("change", filtrarModal);
filtroHastaModal?.addEventListener("change", filtrarModal);

btnLimpiarFiltrosModal?.addEventListener("click", () => {
  buscarVentaModal.value = "";
  filtroDesdeModal.value = "";
  filtroHastaModal.value = "";
  renderVentasModal(ventasCacheModal);
});

// ==============================
function activarBotonesEliminar() {
  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta venta?")) return;

      try {
        await VentasAPI.delete(btn.dataset.id, comercioId);
        cargarVentas();
      } catch (err) {
        alert("Error eliminando venta");
      }
    });
  });
}

function activarBotonesEditar() {
  document.querySelectorAll(".btn-editar").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ventaId = btn.dataset.id;

      const venta = ventasCachePrincipal.find((v) => v.id == ventaId);
      if (!venta) return;

      // 🔹 Limpiar estado previo
      limpiarFormulario();
      ventaEnEdicionId = venta.id;

      // 🔹 Cargar selects
      await cargarClientes();
      await cargarProductos();
      await cargarMetodosYDescuentos();

      // 🔹 Precargar datos básicos
      const d = new Date(venta.fecha);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISOTime = new Date(d - tzOffset).toISOString().slice(0, 10);
      fechaVenta.value = localISOTime;
      fechaVenta.readOnly = true;

      clienteVenta.value = venta.cliente_id;
      clienteVenta.disabled = true;

      metodoPagoVenta.value = venta.metodo_pago;
      descuentoVenta.value = String(parseInt(venta.descuento_porcentaje || 0));

      // 🔹 Traer detalle
      const detalles = await VentasAPI.getDetalle(ventaId);

      carrito = detalles.map((d) => ({
        producto_id: d.producto_id,
        nombre: d.producto_nombre,
        cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario),
        subtotal: Number(d.precio_unitario) * Number(d.cantidad),
      }));

      renderCarrito();

      // modalVenta.style.display = "flex";
    });
  });
}

// ==============================
function activarBotonesVerTicket() {
  document.querySelectorAll(".btn-ver-ticket").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        const ventaId = btn.dataset.id;

        const venta =
          ventasCacheModal.find((v) => v.id == ventaId) ||
          ventasCachePrincipal.find((v) => v.id == ventaId);

        if (!venta) return;

        const detalles = await VentasAPI.getDetalle(ventaId);

        // Rellenar datos generales
        document.getElementById("ticketId").textContent = venta.id;
        document.getElementById("ticketFecha").textContent = formatearFecha(
          venta.fecha,
        );
        document.getElementById("ticketCliente").textContent =
          venta.cliente_nombre || "-";
        document.getElementById("ticketMetodo").textContent = venta.metodo_pago;
        document.getElementById("ticketTotal").textContent = Number(
          venta.total,
        ).toFixed(2);

        // Rellenar detalle
        const tbody = document.getElementById("ticketDetalleBody");
        tbody.innerHTML = "";

        detalles.forEach((d) => {
          const fila = document.createElement("tr");
          fila.innerHTML = `
            <td>${d.producto_nombre}</td>
            <td>${d.cantidad}</td>
            <td>$${Number(d.subtotal).toFixed(2)}</td>
          `;
          tbody.appendChild(fila);
        });

        // Mostrar modal
        document.getElementById("modalTicket").style.display = "flex";
      } catch (error) {
        console.error("Error obteniendo ticket:", error);
      }
    });
  });
}

const modalTicket = document.getElementById("modalTicket");
const cerrarModalTicket = document.getElementById("cerrarModalTicket");

if (cerrarModalTicket) {
  cerrarModalTicket.addEventListener("click", () => {
    modalTicket.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modalTicket) {
    modalTicket.style.display = "none";
  }
});

btnBuscarProducto?.addEventListener("click", () => {
  renderProductosModal(productosCache);
  modalProductos.style.display = "flex";
});

cerrarModalProductos?.addEventListener("click", () => {
  modalProductos.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modalProductos) {
    modalProductos.style.display = "none";
  }
});

function renderProductosModal(lista) {
  tablaProductosModalBody.innerHTML = "";

  lista.forEach((p) => {
    if (p.stock > 0) {
      const fila = document.createElement("tr");

      fila.innerHTML = `
        <td>${p.nombre}</td>
        <td>${p.stock}</td>
      `;

      fila.style.cursor = "pointer";

      fila.addEventListener("click", () => {
        productoVenta.value = p.id;
          const pNombre = document.getElementById("productoVentaNombre");
          if(pNombre) pNombre.value = p.nombre;
          const cVenta = document.getElementById("cantidadVenta");
          if(cVenta) cVenta.focus();
          modalProductos.style.display = "none";
      });

      tablaProductosModalBody.appendChild(fila);
    }
  });
}

buscarProductoModal?.addEventListener("input", () => {
  const texto = buscarProductoModal.value.toLowerCase();

  const filtrados = productosCache.filter((p) =>
    p.nombre.toLowerCase().includes(texto),
  );

  renderProductosModal(filtrados);
});

btnDevolucion?.addEventListener("click", async () => {
  // 🔹 Reset completo
  carritoDevolucion = [];
  ventaSeleccionadaDevolucion = null;

  carritoDevolucionBody.innerHTML = "";
  tablaDetalleVentaBody.innerHTML = "";
  tablaVentasClienteBody.innerHTML = "";
  actualizarTotalDevolucion();

  await cargarClientesDevolucion();

  clienteDevolucion.value = "";

  modalDevolucion.style.display = "flex";
});

cerrarModalDevolucion?.addEventListener("click", () => {
  modalDevolucion.style.display = "none";
});

cerrarModalProductosDevolucion?.addEventListener("click", () => {
  modalProductosDevolucion.style.display = "none";
});

window.addEventListener("click", (e) => {
  if (e.target === modalDevolucion) {
    modalDevolucion.style.display = "none";
  }
  if (e.target === modalProductosDevolucion) {
    modalProductosDevolucion.style.display = "none";
  }
});

async function cargarClientesDevolucion() {
  const clientes = await ClientesAPI.getAll(comercioId);

  clienteDevolucion.innerHTML = `<option value="">Seleccionar cliente</option>`;

  clientes.forEach((c) => {
    clienteDevolucion.innerHTML += `<option value="${c.id}">${c.nombre}</option>`;
  });
}

btnBuscarVentasCliente?.addEventListener("click", async () => {
  const clienteId = clienteDevolucion.value;
  if (!clienteId) return;

  const ventas = await VentasAPI.getAll(comercioId);

  const ventasCliente = ventas.filter((v) => v.cliente_id == clienteId);

  renderVentasCliente(ventasCliente);
});

function renderVentasCliente(lista) {
  tablaVentasClienteBody.innerHTML = "";

  if (!lista.length) {
    tablaVentasClienteBody.innerHTML = `<tr><td colspan="4">No hay ventas para este cliente</td></tr>`;
    return;
  }

  lista.forEach((v) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${formatearFecha(v.fecha)}</td>
      <td>$${Number(v.total).toFixed(2)}</td>
      <td>
        <button class="btn-primario btn-seleccionar-venta"
          data-id="${v.id}"
          data-cliente="${v.cliente_id}">
          Seleccionar
        </button>
      </td>
    `;

    tablaVentasClienteBody.appendChild(fila);
  });

  activarSeleccionVenta();
}

function activarSeleccionVenta() {
  document.querySelectorAll(".btn-seleccionar-venta").forEach((btn) => {
    btn.addEventListener("click", async () => {
      ventaSeleccionadaDevolucion = {
        venta_id: btn.dataset.id,
        cliente_id: btn.dataset.cliente,
      };

      await cargarDetalleVentaParaDevolucion(btn.dataset.id);

      modalProductosDevolucion.style.display = "flex";
    });
  });
}

async function cargarDetalleVentaParaDevolucion(ventaId) {
  const detalles = await VentasAPI.getDetalle(ventaId);

  tablaDetalleVentaBody.innerHTML = "";
  carritoDevolucion = [];
  actualizarTotalDevolucion();

  detalles.forEach((d) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${d.producto_nombre}</td>
      <td>${d.cantidad}</td>
      <td>$${Number(d.precio_unitario).toFixed(2)}</td>
      <td>
        <input type="number"
          min="1"
          max="${d.cantidad}"
          value="1"
          style="width:90px; text-align:center"
          class="app-input"
          id="dev-${d.producto_id}">
      </td>
      <td>
        <button class="btn-primario btn-agregar-dev"
          data-id="${d.producto_id}"
          data-nombre="${d.producto_nombre}"
          data-precio="${d.precio_unitario}"
          data-max="${d.cantidad}">
          Agregar
        </button>
      </td>
    `;

    tablaDetalleVentaBody.appendChild(fila);
  });

  activarAgregarProductoDevolucion();
}

function actualizarTotalDevolucion() {
  const total = carritoDevolucion.reduce((acc, item) => acc + item.subtotal, 0);

  totalDevolucionSpan.textContent = total.toFixed(2);
}

function activarAgregarProductoDevolucion() {
  document.querySelectorAll(".btn-agregar-dev").forEach((btn) => {
    btn.addEventListener("click", () => {
      const productoId = btn.dataset.id;
      const nombre = btn.dataset.nombre;
      const precio = Number(btn.dataset.precio);
      const max = Number(btn.dataset.max);

      const inputCantidad = document.getElementById(`dev-${productoId}`);

      const cantidad = Number(inputCantidad.value);

      if (!cantidad || cantidad <= 0) return;

      if (cantidad > max) {
        alert("Cantidad mayor a la vendida");
        return;
      }

      const subtotal = precio * cantidad;

      carritoDevolucion.push({
        producto_id: productoId,
        nombre,
        cantidad,
        precio_unitario: precio,
        subtotal,
      });

      renderCarritoDevolucion();
    });
  });
}

function renderCarritoDevolucion() {
  carritoDevolucionBody.innerHTML = "";

  carritoDevolucion.forEach((item, index) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>$${item.subtotal.toFixed(2)}</td>
      <td>
        <button class="btn-eliminar-item"
          data-index="${index}">
          🗑
        </button>
      </td>
    `;

    carritoDevolucionBody.appendChild(fila);
  });

  document.querySelectorAll(".btn-eliminar-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      carritoDevolucion.splice(btn.dataset.index, 1);
      renderCarritoDevolucion();
    });
  });

  actualizarTotalDevolucion();
}

btnConfirmarDevolucion?.addEventListener("click", async () => {
  if (carritoDevolucion.length === 0) {
    alert("Debe agregar al menos un producto.");
    return;
  }

  const total = carritoDevolucion.reduce((acc, item) => acc + item.subtotal, 0);

  const payload = {
    venta_id: ventaSeleccionadaDevolucion.venta_id,
    cliente_id: ventaSeleccionadaDevolucion.cliente_id,
    comercio_id: comercioId,
    total,
    items: carritoDevolucion,
  };

  try {
    const res = await DevolucionesAPI.create(payload);
    alert("Devolución registrada correctamente");
  } catch (err) {
    alert("Error al guardar devolución");
    return;
  }

  // 🔄 limpiar estado
  carritoDevolucion = [];
  ventaSeleccionadaDevolucion = null;

  carritoDevolucionBody.innerHTML = "";
  tablaDetalleVentaBody.innerHTML = "";
  totalDevolucionSpan.textContent = "0.00";

  modalProductosDevolucion.style.display = "none";
  modalDevolucion.style.display = "none";

  await cargarVentas();
});

btnVerDevoluciones?.addEventListener("click", async () => {
  await cargarDevoluciones();
  modalVerDevoluciones.style.display = "flex";
});

cerrarModalVerDevoluciones?.addEventListener("click", () => {
  modalVerDevoluciones.style.display = "none";
});

async function cargarDevoluciones() {
  const devoluciones = await DevolucionesAPI.getAll(comercioId);

  tablaDevolucionesBody.innerHTML = "";

  devoluciones.forEach((d) => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${formatearFecha(d.fecha)}</td>
      <td>${d.cliente_nombre || "—"}</td>
      <td>$${Number(d.total).toFixed(2)}</td>
      <td>
        <button class="btn-ver-ticket btn-ver-devolucion" data-id="${d.id}">
  Ver
</button>
      </td>
    `;

    tablaDevolucionesBody.appendChild(fila);
  });

  activarBotonesVerDevolucion();
}

function activarBotonesVerDevolucion() {
  document.querySelectorAll(".btn-ver-devolucion").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const devolucionId = btn.dataset.id;

      const devoluciones = await DevolucionesAPI.getAll(comercioId);
      const devolucion = devoluciones.find((d) => d.id == devolucionId);

      const detalles = await DevolucionesAPI.getDetalle(devolucionId);

      document.getElementById("ticketDevId").textContent = devolucion.id;
      document.getElementById("ticketDevFecha").textContent = formatearFecha(
        devolucion.fecha,
      );
      document.getElementById("ticketDevCliente").textContent =
        devolucion.cliente_nombre || "-";
      document.getElementById("ticketDevTotal").textContent = Number(
        devolucion.total,
      ).toFixed(2);

      const tbody = document.getElementById("ticketDevDetalleBody");
      tbody.innerHTML = "";

      detalles.forEach((d) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${d.producto_nombre}</td>
            <td>${d.cantidad}</td>
            <td>$${Number(d.subtotal).toFixed(2)}</td>
          `;
        tbody.appendChild(fila);
      });

      modalTicketDevolucion.style.display = "flex";
    });
  });
}

cerrarModalTicketDevolucion?.addEventListener("click", () => {
  modalTicketDevolucion.style.display = "none";
});

// ==============================
function formatearFecha(fechaISO) {
  if (!fechaISO) return "—";

  const fecha = new Date(fechaISO);

  return fecha.toLocaleDateString("es-AR");
}

// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  await cargarComercio();
  if (comercioId) {
    await cargarVentas();
    await cargarProductos();
    await cargarClientes();
    await cargarMetodosYDescuentos();

    // Show modal if redirected by F10
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("openModal") === "true") {
      window.history.replaceState({}, document.title, "ventas.html");
      setTimeout(() => {
        if (btnNuevaVenta) btnNuevaVenta.click();
      }, 300);
    }
  } else {
    console.error("No se pudo obtener comercioId en Ventas");
  }
});

// ==============================
// CREACIÓN RÁPIDA DE CLIENTE
// ==============================
const btnCrearClienteRapido = document.getElementById("btnCrearClienteRapido");
const modalCrearClienteRapido = document.getElementById("modalCrearClienteRapido");
const cerrarModalClienteRapido = document.getElementById("cerrarModalClienteRapido");
const formClienteRapido = document.getElementById("formClienteRapido");

// Elementos de localidad
const SelectLocalidadRapido = document.getElementById("localidadClienteRapido");
const btnNuevaLocalidadRapida = document.getElementById("btnNuevaLocalidadClienteRapido");
const inputNuevaLocalidadRapida = document.getElementById("nuevaLocalidadClienteRapido");

async function cargarLocalidadesRapido() {
  try {
    const localidades = await ClientesAPI.getLocalidades(comercioId);
    SelectLocalidadRapido.innerHTML = '<option value="">Seleccionar localidad</option>';
    localidades.forEach((loc) => {
      if (loc) {
        SelectLocalidadRapido.innerHTML += `<option value="${loc}">${loc}</option>`;
      }
    });
  } catch (error) {
    console.error("Error al cargar localidades", error);
  }
}

if (btnNuevaLocalidadRapida) {
  btnNuevaLocalidadRapida.addEventListener("click", () => {
    if (inputNuevaLocalidadRapida.style.display === "none") {
      inputNuevaLocalidadRapida.style.display = "block";
      SelectLocalidadRapido.value = "";
      SelectLocalidadRapido.disabled = true;
      btnNuevaLocalidadRapida.textContent = "Cancelar";
    } else {
      inputNuevaLocalidadRapida.style.display = "none";
      inputNuevaLocalidadRapida.value = "";
      SelectLocalidadRapido.disabled = false;
      btnNuevaLocalidadRapida.textContent = "Nueva";
    }
  });
}

if (btnCrearClienteRapido) {
  btnCrearClienteRapido.addEventListener("click", async () => {
    // Reset form
    formClienteRapido.reset();
    inputNuevaLocalidadRapida.style.display = "none";
    inputNuevaLocalidadRapida.value = "";
    SelectLocalidadRapido.disabled = false;
    btnNuevaLocalidadRapida.textContent = "Nueva";

    await cargarLocalidadesRapido();
    modalCrearClienteRapido.style.display = "flex";
  });
}

if (cerrarModalClienteRapido) {
  cerrarModalClienteRapido.addEventListener("click", () => {
    modalCrearClienteRapido.style.display = "none";
  });
}

window.addEventListener("click", (e) => {
  if (e.target === modalCrearClienteRapido) {
    modalCrearClienteRapido.style.display = "none";
  }
});

if (formClienteRapido) {
  formClienteRapido.addEventListener("submit", async (e) => {
    e.preventDefault();

    let localidadFinal = SelectLocalidadRapido.value;
    if (inputNuevaLocalidadRapida.style.display === "block" && inputNuevaLocalidadRapida.value.trim() !== "") {
      localidadFinal = inputNuevaLocalidadRapida.value.trim();
    }

    const data = {
      nombre: document.getElementById("nombreClienteRapido").value.trim(),
      telefono: document.getElementById("telefonoClienteRapido").value.trim(),
      localidad: localidadFinal,
      fecha_nacimiento: document.getElementById("fechaNacimientoClienteRapido").value,
      genero: document.getElementById("generoClienteRapido").value,
      email: document.getElementById("emailClienteRapido").value.trim(),
      comentarios: document.getElementById("comentariosClienteRapido").value.trim(),
      comercio_id: comercioId,
    };

    try {
      const nuevoCliente = await ClientesAPI.create(data);
      alert("Cliente guardado correctamente");
      modalCrearClienteRapido.style.display = "none";
      
      const modalBuscar = document.getElementById("modalBuscarCliente");
      if (modalBuscar && modalBuscar.style.display === "flex") {
        allClientes = await ClientesAPI.getAll(comercioId);
        currentFilteredClientes = allClientes;
        modalVisibleCount = 20;
        renderClientesBuscadorLazy(false);
      } else {
        const cVal = document.getElementById("clienteVenta");
        const cNom = document.getElementById("clienteVentaNombre");
        if (cVal) cVal.value = nuevoCliente.id;
        if (cNom) cNom.value = nuevoCliente.nombre;
      }
    } catch (err) {
      alert("Error guardando cliente rápido: " + (err.message || "Error interno"));
    }
  });
}

// ==============================
// POS REFACTOR LOGIC
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
  const btnToggleVista = document.getElementById("btnToggleVista");
  const posContainer = document.getElementById("pos-container");
  const historyContainer = document.getElementById("history-container");
  const title = document.querySelector(".app-title");
  
  if(btnToggleVista) {
    btnToggleVista.addEventListener("click", () => {
      if(posContainer.style.display === "none") {
        posContainer.style.display = "grid";
        historyContainer.style.display = "none";
        btnToggleVista.textContent = "Ver Historial del Día";
        title.textContent = "Punto de Venta";
      } else {
        posContainer.style.display = "none";
        historyContainer.style.display = "block";
        btnToggleVista.textContent = "Volver a Punto de Venta";
        title.textContent = "Historial de Ventas";
      }
    });
  }

  // Pre-load POS
  const hoy = new Date().toLocaleDateString("sv-SE");
  const fechaVenta = document.getElementById("fechaVenta");
  if(fechaVenta) {
    fechaVenta.value = hoy;
    fechaVenta.readOnly = true;
  }
  
  // Expose Clientes to Modal
  const btnBuscarCliente = document.getElementById("btnBuscarCliente");

  const autocompleteClientes = document.getElementById("autocompleteClientes");
  const clienteVentaNombre = document.getElementById("clienteVentaNombre");
  
  if (clienteVentaNombre && autocompleteClientes) {
    clienteVentaNombre.addEventListener("input", async (e) => {
      const val = e.target.value.toLowerCase().trim();
      if (!val) {
        autocompleteClientes.style.display = "none";
        return;
      }
      
      // Fetch if empty
      if (!allClientes || allClientes.length === 0) {
        allClientes = await ClientesAPI.getAll(comercioId);
      }
      
      const filtrados = allClientes.filter(c => c.nombre.toLowerCase().includes(val)).slice(0, 10);
      
      autocompleteClientes.innerHTML = "";
      if (filtrados.length > 0) {
        filtrados.forEach(c => {
          const li = document.createElement("li");
          li.textContent = c.nombre;
          li.addEventListener("mousedown", (ev) => {
            ev.preventDefault(); // Prevents blur
            clienteVenta.value = c.id;
            clienteVentaNombre.value = c.nombre;
            autocompleteClientes.style.display = "none";
          });
          autocompleteClientes.appendChild(li);
        });
        autocompleteClientes.style.display = "block";
      } else {
        autocompleteClientes.style.display = "none";
      }
    });

    clienteVentaNombre.addEventListener("blur", () => {
      setTimeout(() => autocompleteClientes.style.display = "none", 150);
    });
    
    // Remove the old click listener that opens the modal
    // Actually, let's just make sure it doesn't open the modal if we click it.
    // The previous listener was on clienteVentaNombre.
  }

  const modalBuscarCliente = document.getElementById("modalBuscarCliente");
  const cerrarModalBuscarCliente = document.getElementById("cerrarModalBuscarCliente");
  const tablaClientesBuscadorBody = document.getElementById("tablaClientesBuscadorBody");
  const inputBuscarClienteModal = document.getElementById("inputBuscarClienteModal");
  
  const openClientModal = async () => {
    allClientes = await ClientesAPI.getAll(comercioId);
    currentFilteredClientes = allClientes;
    modalVisibleCount = 20;
    renderClientesBuscadorLazy(false);
    modalBuscarCliente.style.display = "flex";
    inputBuscarClienteModal.focus();
  };

  if(btnBuscarCliente) btnBuscarCliente.addEventListener("click", openClientModal);
  if(clienteVentaNombre) // clienteVentaNombre.addEventListener("click", openClientModal);
  
  if(cerrarModalBuscarCliente) {
    cerrarModalBuscarCliente.addEventListener("click", () => modalBuscarCliente.style.display = "none");
  }

  if(inputBuscarClienteModal) {
    
  const modalTablaContainer = document.querySelector("#modalBuscarCliente .v-tabla-container");
  if (modalTablaContainer) {
    modalTablaContainer.addEventListener("scroll", () => {
      if (modalTablaContainer.scrollTop + modalTablaContainer.clientHeight >= modalTablaContainer.scrollHeight - 50) {
        if (modalVisibleCount < currentFilteredClientes.length) {
          modalVisibleCount += 20;
          renderClientesBuscadorLazy(true);
        }
      }
    });
  }

  inputBuscarClienteModal.addEventListener("input", (e) => {
      const q = e.target.value.toLowerCase();
      currentFilteredClientes = allClientes.filter(c => c.nombre.toLowerCase().includes(q));
      modalVisibleCount = 20;
      renderClientesBuscadorLazy(false);
    });
  }
  
  
  
  const btnNuevoClienteDesdeBuscador = document.getElementById("btnNuevoClienteDesdeBuscador");
  if(btnNuevoClienteDesdeBuscador) {
    btnNuevoClienteDesdeBuscador.addEventListener("click", () => {
      // DO NOT HIDE modalBuscarCliente so it stays behind
      document.getElementById("btnCrearClienteRapido").click();
    });
  }

  // Hook original buttons that are no longer needed
  

});


// Ticket Modal Listeners
document.addEventListener("DOMContentLoaded", () => {
  const btnAceptarTicketExito = document.getElementById("btnAceptarTicketExito");
  const modalTicketExito = document.getElementById("modalTicketExito");
  const btnImprimirTicketExito = document.getElementById("btnImprimirTicketExito");

  if(btnAceptarTicketExito) {
    btnAceptarTicketExito.addEventListener("click", () => {
      modalTicketExito.style.display = "none";
      // Actualizar listado de fondo
      cargarVentas();
    });
  }

  if(btnImprimirTicketExito) {
    btnImprimirTicketExito.addEventListener("click", () => {
      const contenido = document.getElementById("ticketExitoContenido").innerHTML;
      const ventana = window.open('', '_blank', 'width=300,height=500');
      ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
      ventana.document.write(contenido);
      ventana.document.write('</body></html>');
      ventana.document.close();
      ventana.onload = () => {
        ventana.print();
        ventana.close();
      };
    });
  }

  // History Filter and Volver Listeners
  const btnVolverVentas = document.getElementById("btnVolverVentas");
  const posContainer = document.getElementById("pos-container");
  const historyContainer = document.getElementById("history-container");
  const title = document.querySelector(".app-title");
  
  if (btnVolverVentas) {
    btnVolverVentas.addEventListener("click", () => {
      posContainer.style.display = "grid";
      historyContainer.style.display = "none";
      title.textContent = "Punto de Venta";
    });
  }

  const filtroFechaHistorial = document.getElementById("filtroFechaHistorial");
  if (filtroFechaHistorial) {
    // Set default to today
    const hoyLocal = new Date();
    // Format YYYY-MM-DD
    const tzoffset = hoyLocal.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    filtroFechaHistorial.value = localISOTime;

    filtroFechaHistorial.addEventListener("change", (e) => {
      const selectedDate = e.target.value; // YYYY-MM-DD
      if (!selectedDate) {
        renderVentasPrincipal(ventasCacheModal); // all
        return;
      }
      
      const filtered = ventasCacheModal.filter(v => {
        if (!v.fecha) return false;
        return v.fecha.startsWith(selectedDate); // Assumes v.fecha is ISO format from db
      });
      
      ventasCachePrincipal = filtered;
      renderVentasPrincipal(filtered);
    });
  }
});

// ==============================
// AUTOCOMPLETE PRODUCTOS
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const productoVentaNombre = document.getElementById("productoVentaNombre");
  const productoVentaId = document.getElementById("productoVenta");
  const autocompleteProductos = document.getElementById("autocompleteProductos");

  if (productoVentaNombre && autocompleteProductos) {
    productoVentaNombre.addEventListener("input", (e) => {
      const val = e.target.value.toLowerCase().trim();
      if (!val) {
        autocompleteProductos.style.display = "none";
        productoVentaId.value = "";
        return;
      }
      
      const filtrados = (typeof productosCache !== 'undefined' ? productosCache : []).filter(p => p.nombre.toLowerCase().includes(val) || (p.codigo_barras && p.codigo_barras.toLowerCase().includes(val))).slice(0, 10);
      
      autocompleteProductos.innerHTML = "";
      if (filtrados.length > 0) {
        filtrados.forEach(p => {
          const li = document.createElement("li");
          li.innerHTML = `${p.nombre} - $${Number(p.precio).toFixed(2)}`;
          li.addEventListener("mousedown", (ev) => {
            ev.preventDefault(); // Prevents blur
            productoVentaId.value = p.id;
            productoVentaNombre.value = p.nombre;
            autocompleteProductos.style.display = "none";
            // Auto focus cantidad
            const cant = document.getElementById("cantidadVenta");
            if (cant) cant.focus();
          });
          autocompleteProductos.appendChild(li);
        });
        autocompleteProductos.style.display = "block";
      } else {
        autocompleteProductos.style.display = "none";
      }
    });

    productoVentaNombre.addEventListener("blur", () => {
      setTimeout(() => autocompleteProductos.style.display = "none", 150);
    });
  }
});

window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof allClientes !== 'undefined' && allClientes) {
      const cf = allClientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
      if (cf) {
        const inputId = document.getElementById("clienteVenta");
        const inputNombre = document.getElementById("clienteVentaNombre");
        if (inputId && inputNombre && !inputId.value) {
          inputId.value = cf.id;
          inputNombre.value = cf.nombre;
        }
      }
    }
  }, 1500); // 1.5s delay to ensure everything loaded
});
