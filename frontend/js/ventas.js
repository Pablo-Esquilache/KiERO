import { escapeHtml } from "./utils/escapeHtml.js";
import { toastError, toastOk, toastWarning, toastInfo } from "./utils/toast.js";
import { debounce } from "./utils/debounce.js";
import {
  VentasAPI,
  ComercioAPI,
  ClientesAPI,
  ProductosAPI,
  DevolucionesAPI,
  CajasAPI,
} from "./api.js";


// ==============================

document.getElementById("cerrarModalTicketDevolucion")?.addEventListener("click", () => {
  const m = document.getElementById("modalTicketDevolucion");
  if(m) m.style.display = "none";
});

// HELPERS (RESTORED)

document.getElementById("btnImprimirTicketDevolucion")?.addEventListener("click", () => {
  const contenido = document.getElementById("ticketDevExitoContenido")?.innerHTML || "";
  const ventana = window.open('', '_blank', 'width=300,height=500');
  ventana.document.write('<html><head><title>Imprimir Ticket Devolución</title></head><body style="font-family: monospace;">');
  ventana.document.write('<h3 style="text-align:center;">Comprobante de Devolución</h3>');
  ventana.document.write(contenido);
  ventana.document.write('</body></html>');
  ventana.document.close();
  ventana.onload = () => {
    ventana.print();
    ventana.close();
  };
});


window.verDetalleDevolucion = async (devolucionId) => {
  try {
    const devoluciones = await DevolucionesAPI.getAll(comercioId);
    const devolucion = devoluciones.find((d) => d.id == devolucionId);
    if(!devolucion) return;

    const detalles = await DevolucionesAPI.getDetalle(devolucionId);

    const ticketContent = document.getElementById("ticketDevExitoContenido");
    if (ticketContent) {
      const fechaFormat = window.formatearFecha ? window.formatearFecha(devolucion.fecha) : devolucion.fecha;
      const clienteName = devolucion.cliente_nombre || "Consumidor Final";
      
      let itemsHtml = "";
      for(let item of detalles) {
          itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>${item.cantidad}x ${escapeHtml(item.producto_nombre) || "Producto"}</span><span>${Number(item.subtotal).toFixed(2)}</span></div>`;
      }
      
      ticketContent.innerHTML = `
          <div style="margin-bottom: 5px;"><strong>ID Devolución:</strong> ${devolucion.id}</div>
          <div style="margin-bottom: 5px;"><strong>Fecha:</strong> ${fechaFormat}</div>
          <div style="margin-bottom: 5px;"><strong>Cliente:</strong> ${clienteName}</div>
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          ${itemsHtml}
          <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
          <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">Total Reintegrado: ${Number(devolucion.total).toFixed(2)}</div>
      `;
    }

    const modalTicketDev = document.getElementById("modalTicketDevolucion");
    if(modalTicketDev) modalTicketDev.style.display = "flex";
  } catch(err) {
    console.error("Error al cargar detalle devolucion", err);
  }
};

// ==============================
window.formatearFecha = function(fechaISO) {
  if (!fechaISO) return "-";
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-AR");
};
function formatearFecha(fechaISO) {
  return window.formatearFecha(fechaISO);
}





window.ensureProductosLoaded = async () => {
  if (!productosCache || productosCache.length === 0) {
    productosCache = await ProductosAPI.getAll(comercioId);
  }
};


// GLOBAL ALIAS FOR PRODUCTS
window.renderProductosModal = function(lista) {
  if (typeof currentFilteredProductos !== 'undefined') {
    currentFilteredProductos = lista;
    prodVisibleCount = 20;
    if (typeof renderProductosModalLazy === 'function') {
      renderProductosModalLazy(false);
    }
  }
};

// DEVOLUCIONES LAZY LOAD STATE
let devVisibleCount = 20;
let currentFilteredDevoluciones = [];

const renderDevolucionesLazy = (append = false) => {
  const tablaDevolucionesBody = document.getElementById("tablaDevolucionesBody");
  if (!tablaDevolucionesBody) return;
  
  if (!append) {
    tablaDevolucionesBody.innerHTML = "";
  }
  
  const limit = Math.min(devVisibleCount, currentFilteredDevoluciones.length);
  const startIndex = append ? devVisibleCount - 20 : 0;
  
  for (let i = startIndex; i < limit; i++) {
    const d = currentFilteredDevoluciones[i];
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${formatearFecha(d.fecha)}</td>
      <td>${escapeHtml(d.cliente_nombre) || "Consumidor Final"}</td>
      <td>$${Number(d.total).toFixed(2)}</td>
      <td>
        <button class="btn-ver-ticket btn-ver-devolucion" data-id="${d.id}">Ver</button>
      </td>
    `;
    tablaDevolucionesBody.appendChild(fila);
  }
  
  // Re-bind click events for newly rendered buttons
  document.querySelectorAll(".btn-ver-devolucion").forEach((b) =>
    b.addEventListener("click", () => { if(window.verDetalleDevolucion) window.verDetalleDevolucion(b.dataset.id); })
  );
};



// PRODUCT LAZY LOAD STATE
let prodVisibleCount = 20;
let currentFilteredProductos = [];

const renderProductosModalLazy = (append = false) => {
  const tabla = document.getElementById("tablaProductosModalBody");
  if (!tabla) return;
  if (!append) {
    tabla.innerHTML = "";
  }
  const limit = Math.min(prodVisibleCount, currentFilteredProductos.length);
  const startIndex = append ? prodVisibleCount - 20 : 0;
  for (let i = startIndex; i < limit; i++) {
    const p = currentFilteredProductos[i];
    const fila = document.createElement("tr");
    fila.innerHTML = `<td>${escapeHtml(p.nombre)}</td><td>${p.stock}</td>`;
    fila.style.cursor = "pointer";
    fila.addEventListener("click", () => {
      const tId = document.getElementById(window.targetProductInput || 'productoVenta');
      const tName = document.getElementById(window.targetProductNameInput || 'productoVentaNombre');
      if(tId) tId.value = p.id;
      if(tName) tName.value = p.nombre;
      
      const isDev = window.targetProductInput === 'productoDevolucion';
      const qtyInput = document.getElementById(isDev ? "cantidadDevolucion" : "cantidadVenta");
      if (qtyInput) qtyInput.focus();
      
      const modalProductos = document.getElementById("modalProductos");
      if(modalProductos) modalProductos.style.display = "none";
    });
    tabla.appendChild(fila);
  }
};
// Global targets for Modals
window.targetClientInput = 'clienteVenta';
window.targetClientNameInput = 'clienteVentaNombre';
window.targetProductInput = 'productoVenta';
window.targetProductNameInput = 'productoVentaNombre';



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
            const posHeader = document.querySelector(".pos-header");
            const posContainer = document.getElementById("pos-container");
            const historyContainer = document.getElementById("history-container");
            const btnToggleVista = document.getElementById("btnToggleVista");
            
            if (!cajaActual || cajaActual.estado !== "abierta") {
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
                    
                    
                    navItem.innerHTML = "Ventas 🔒";
                }
            } else {
                // Caja abierta: mostramos la interfaz que estaba oculta por defecto en HTML
                if (posHeader) posHeader.style.display = "block";
                if (posContainer) posContainer.style.display = "grid";

                // INIT POS
                const hoy = new Date().toLocaleDateString("sv-SE");
                const fVenta = document.getElementById("fechaVenta");
                if (fVenta) {
                  fVenta.value = hoy;
                  fVenta.readOnly = true;
                }
                
                if (btnToggleVista) {
                  btnToggleVista.addEventListener("click", () => {
    const pos = document.getElementById("pos-container");
    const hist = document.getElementById("history-container");
    pos.style.display = "none";
    hist.style.display = "block";
    if(typeof cargarVentas === "function") cargarVentas();
    
    // Configurar la fecha en el filtro historial
    const fHist = document.getElementById("filtroFechaHistorial");
    if(fHist && !fHist.value) {
      fHist.value = new Date().toLocaleDateString("sv-SE");
    }
  });
                }
                
                if(typeof cargarClientes === "function") cargarClientes();
                if(typeof cargarProductos === "function") cargarProductos();
                if(typeof cargarMetodosYDescuentos === "function") cargarMetodosYDescuentos();
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
      <td>${escapeHtml(c.nombre)}</td>
      <td>${escapeHtml(c.telefono) || "-"}</td>
      <td>${escapeHtml(c.email) || "-"}</td>
    `;
    tr.addEventListener("click", () => {
      document.getElementById(window.targetClientInput).value = c.id;
        document.getElementById(window.targetClientNameInput).value = c.nombre;
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

    await Promise.all([
      cargarClientes(),
      cargarProductos(),
      cargarMetodosYDescuentos()
    ]);
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
    const rMetodos = await fetch(`/api/ajustes/metodos_pago/${comercioId}`, { headers: { "Authorization": `Bearer ${session?.token || ''}` } });
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
    const rDescuentos = await fetch(`/api/ajustes/descuentos/${comercioId}`, { headers: { "Authorization": `Bearer ${session?.token || ''}` } });
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
      productoVenta.innerHTML += `<option value="${p.id}">${escapeHtml(p.nombre)}</option>`;
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
    toastInfo(`Stock insuficiente. Disponible en total: ${stockDisponible}`);
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
        toastWarning("Producto no encontrado con ese código.");
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
      <td>${escapeHtml(item.nombre)}</td>
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
          toastInfo(`Stock insuficiente. Disponible en total: ${stockDisponible}`);
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
      toastWarning("Debe agregar al menos un producto.");
      return;
    }
    const submitBtn = formVenta.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

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
                itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>${i.cantidad}x ${escapeHtml(i.nombre)}</span><span>${i.subtotal.toFixed(2)}</span></div>`;
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
      toastError(err.message || "Error guardando venta");
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
      <td>${escapeHtml(v.cliente_nombre) || "-"}</td>
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
        toastError("Error eliminando venta");
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
      await Promise.all([
      cargarClientes(),
      cargarProductos(),
      cargarMetodosYDescuentos()
    ]);

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
    document.querySelectorAll(".btn-ver-ticket:not(.btn-ver-devolucion)").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          const ventaId = btn.dataset.id;
          const venta = ventasCacheModal.find((v) => v.id == ventaId) || ventasCachePrincipal.find((v) => v.id == ventaId);
          if (!venta) return;
  
          const detalles = await VentasAPI.getDetalle(ventaId);
          
          let itemsHtml = "";
          for(let item of detalles) {
              itemsHtml += `<div style="display:flex; justify-content:space-between;"><span>${item.cantidad}x ${escapeHtml(item.producto_nombre) || "Producto"}</span><span>${Number(item.subtotal).toFixed(2)}</span></div>`;
          }
          
          let descHtml = "";
          if (Number(venta.descuento_monto) > 0) {
            descHtml = `<div style="display:flex; justify-content:space-between; color: #e63946;"><span>Descuento (${venta.descuento_porcentaje}%)</span><span>-${Number(venta.descuento_monto).toFixed(2)}</span></div>`;
          }

          const ticketHTML = `
            <div style="margin-bottom: 5px;"><strong>ID Venta:</strong> ${venta.id}</div>
            <div style="margin-bottom: 5px;"><strong>Fecha:</strong> ${formatearFecha(venta.fecha)}</div>
            <div style="margin-bottom: 5px;"><strong>Cliente:</strong> ${escapeHtml(venta.cliente_nombre) || "Consumidor Final"}</div>
            <div style="margin-bottom: 5px;"><strong>Método de pago:</strong> ${venta.metodo_pago}</div>
            <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
            ${itemsHtml}
            ${descHtml ? `<div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>${descHtml}` : ""}
            <div style="border-top: 1px dashed #ccc; margin: 10px 0;"></div>
            <div style="text-align: right; font-weight: bold; font-size: 1.2em; margin-top: 5px;">Total: ${Number(venta.total).toFixed(2)}</div>
          `;

          document.getElementById("ticketHistorialContenido").innerHTML = ticketHTML;
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
  window.renderProductosModal(productosCache);
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
        <td>${escapeHtml(p.nombre)}</td>
        <td>${p.stock}</td>
      `;

      fila.style.cursor = "pointer";

      fila.addEventListener("click", () => {
          const tId = document.getElementById(window.targetProductInput || 'productoVenta');
          const tName = document.getElementById(window.targetProductNameInput || 'productoVentaNombre');
          
          if(tId) tId.value = p.id;
          if(tName) tName.value = p.nombre;
          
          // Focus the quantity input based on which module we are in
          const isDev = window.targetProductInput === 'productoDevolucion';
          const qtyInput = document.getElementById(isDev ? "cantidadDevolucion" : "cantidadVenta");
          if (qtyInput) qtyInput.focus();
          
          modalProductos.style.display = "none";
      });

      tablaProductosModalBody.appendChild(fila);
    }
  });
}

buscarProductoModal?.addEventListener("input", () => {
  const texto = buscarProductoModal.value.toLowerCase();

  const filtrados = productosCache.filter((p) => p.nombre.toLowerCase().includes(texto) || (p.codigo_barras && p.codigo_barras.includes(texto)));

  window.renderProductosModal(filtrados);
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
    clienteDevolucion.innerHTML += `<option value="${c.id}">${escapeHtml(c.nombre)}</option>`;
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
        toastWarning("Cantidad mayor a la vendida");
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
      <td>${escapeHtml(item.nombre)}</td>
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
    toastWarning("Debe agregar al menos un producto.");
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
    toastInfo("Devolución registrada correctamente");
  } catch (err) {
    toastInfo("Error al guardar devolución");
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

const btnVerDevolucionesLeft = document.getElementById("btnVerDevolucionesLeft");
btnVerDevolucionesLeft?.addEventListener("click", async () => {
  await cargarDevoluciones();
  modalVerDevoluciones.style.display = "flex";
});

cerrarModalVerDevoluciones?.addEventListener("click", () => {
  modalVerDevoluciones.style.display = "none";
});

async function cargarDevoluciones() {
  const devoluciones = await DevolucionesAPI.getAll(comercioId);
  currentFilteredDevoluciones = devoluciones;
  devVisibleCount = 20;
  renderDevolucionesLazy(false);
}

// Add to cart modified for free products (we don't check venta_id anymore)
const btnAgregarDevolucionNuevo = document.getElementById("btnAgregarDevolucion");
btnAgregarDevolucionNuevo?.addEventListener("click", () => {
  const prodId = productoDevolucion?.value;
  const cant = Number(cantidadDevolucion?.value);
  
  if (!prodId) {
    toastInfo("Seleccioná un producto de la lista");
    return;
  }
  if (!cant || cant <= 0) {
    toastInfo("Ingresá una cantidad válida");
    return;
  }
  
  const prodObj = productosCache.find(p => p.id == prodId);
  if (!prodObj) return;

  const ex = carritoDevolucion.find(i => i.producto_id == prodId);
  if (ex) {
    ex.cantidad += cant;
    ex.subtotal = ex.cantidad * Number(prodObj.precio);
  } else {
    carritoDevolucion.push({
      producto_id: prodId,
      nombre: prodObj.nombre,
      cantidad: cant,
      precio_unitario: Number(prodObj.precio),
      subtotal: cant * Number(prodObj.precio)
    });
  }
  
  renderCarritoDevolucion();
  productoDevolucion.value = "";
  productoDevolucionNombre.value = "";
  cantidadDevolucion.value = "";
});

// Submit Formulario Modificado


// ==========================================
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
    campoLocalidad.innerHTML = `<option value="">Seleccionar localidad</option>`;
    localidades.forEach((loc) => {
      campoLocalidad.innerHTML += `<option value="${loc}">${loc}</option>`;
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
      toastError(err.message || "Error creando cliente");
    } finally {
      if(btn) {
        btn.textContent = oldText;
        btn.disabled = false;
      }
    }
  });
}

// NUEVA LÓGICA DEVOLUCIONES LIBRES (RESTORED)
// ==========================================
const btnCrearDevolucionLeft = document.getElementById("btnCrearDevolucionLeft");
const clienteDevolucionNombre = document.getElementById("clienteDevolucionNombre");
const autocompleteClientesDevolucion = document.getElementById("autocompleteClientesDevolucion");
const productoDevolucionNombre = document.getElementById("productoDevolucionNombre");
const autocompleteProductosDevolucion = document.getElementById("autocompleteProductosDevolucion");
const metodoPagoDevolucion = document.getElementById("metodoPagoDevolucion");

btnCrearDevolucionLeft?.addEventListener("click", () => {
  carritoDevolucion = [];
  renderCarritoDevolucion();
  
  if (clienteDevolucion) clienteDevolucion.value = "";
  if (clienteDevolucionNombre) clienteDevolucionNombre.value = "";
  if (productoDevolucion) productoDevolucion.value = "";
  if (productoDevolucionNombre) productoDevolucionNombre.value = "";
  if (cantidadDevolucion) cantidadDevolucion.value = "";

  const modalDev = document.getElementById("modalDevolucion");
  if (modalDev) modalDev.style.display = "flex";
});

// Autocomplete Clientes Devolucion
clienteDevolucionNombre?.addEventListener("input", debounce(async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.innerHTML = "";
  if (!q) {
    if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
    if(clienteDevolucion) clienteDevolucion.value = "";
    return;
  }
  
  if (!allClientes || allClientes.length === 0) {
    // We need to fetch!
    allClientes = await ClientesAPI.getAll(comercioId);
  }
  
  const filtrados = allClientes.filter(c => c.nombre.toLowerCase().includes(q) || c.documento?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
    return;
  }
  filtrados.forEach(c => {
    const li = document.createElement("li");
    li.textContent = c.documento ? `${escapeHtml(c.nombre)} (${c.documento})` : c.nombre;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(clienteDevolucion) clienteDevolucion.value = c.id;
      if(clienteDevolucionNombre) clienteDevolucionNombre.value = c.nombre;
      if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
    });
    if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.appendChild(li);
  });
  if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "block";
}, 300));

clienteDevolucionNombre?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
  }, 150);
});

// Autocomplete Productos Devolucion
productoDevolucionNombre?.addEventListener("input", debounce(async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.innerHTML = "";
  if (!q) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
    if(productoDevolucion) productoDevolucion.value = "";
    return;
  }
  
  await window.ensureProductosLoaded();
  
  const filtrados = productosCache.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
    return;
  }
  filtrados.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${escapeHtml(p.nombre)} - ${Number(p.precio).toFixed(2)}`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(productoDevolucion) productoDevolucion.value = p.id;
      if(productoDevolucionNombre) productoDevolucionNombre.value = p.nombre;
      if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
      if(cantidadDevolucion) cantidadDevolucion.focus();
    });
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.appendChild(li);
  });
  if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "block";
}, 300));

productoDevolucionNombre?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
  }, 150);
});


const formDevolucionNuevo = document.getElementById("formDevolucion");
formDevolucionNuevo?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (carritoDevolucion.length === 0) {
    toastInfo("El carrito de devolución está vacío");
    return;
  }
  
  const cliId = document.getElementById("clienteDevolucion")?.value || null;
  // metPago removed
  
  const payload = {
    comercio_id: comercioId,
    cliente_id: cliId, // Puede ser null, el backend lo aceptará si quitamos el constraint
    venta_id: null, // Ya no lo usamos en debolucion libre
    
    items: carritoDevolucion
  };
  
  try {
    const data = await DevolucionesAPI.create(JSON.stringify(payload));
    
    toastInfo("Devolución generada con éxito");
    carritoDevolucion = [];
    renderCarritoDevolucion();
    
    if (clienteDevolucion) clienteDevolucion.value = "";
    if (clienteDevolucionNombre) clienteDevolucionNombre.value = "";
    
    document.getElementById("modalDevolucion").style.display = "none";
  } catch (error) {
    console.error(error);
    toastError(error.message);
  }
});

// ==========================================
// LUPITAS EN DEVOLUCIONES
// ==========================================
document.getElementById("btnBuscarClienteDev")?.addEventListener("click", () => {
  window.targetClientInput = 'clienteDevolucion';
  window.targetClientNameInput = 'clienteDevolucionNombre';
  if(typeof window.openClientModal === 'function') window.openClientModal();
});

document.getElementById("btnBuscarProductoDev")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoDevolucion';
  window.targetProductNameInput = 'productoDevolucionNombre';
  
  if(typeof window.ensureProductosLoaded === 'function') {
    await window.ensureProductosLoaded();
  }
  if(typeof window.renderProductosModal === 'function') {
    window.renderProductosModal(productosCache);
  }
  
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});

// Update the main POS button to set targets
document.getElementById("btnBuscarProducto")?.addEventListener("click", async () => {
  window.targetProductInput = 'productoVenta';
  window.targetProductNameInput = 'productoVentaNombre';
  await window.ensureProductosLoaded();
  if (typeof renderProductosModal === 'function') {
    window.renderProductosModal(productosCache);
  }
  const m = document.getElementById("modalProductos");
  if(m) {
    m.style.display = "flex";
    document.getElementById("buscarProductoModal")?.focus();
  }
});

// ===================================
// BIND SCROLL EVENTS FOR LAZY LOAD
// ===================================
document.addEventListener("DOMContentLoaded", () => {
  const scrollCli = document.getElementById("scrollClientesBuscador");
  if(scrollCli) {
    scrollCli.addEventListener("scroll", () => {
      if (scrollCli.scrollTop + scrollCli.clientHeight >= scrollCli.scrollHeight - 50) {
        if (modalVisibleCount < currentFilteredClientes.length) {
          modalVisibleCount += 20;
          renderClientesBuscadorLazy(true);
        }
      }
    });
  }
  
  const scrollProd = document.getElementById("scrollProductosBuscador");
  if(scrollProd) {
    scrollProd.addEventListener("scroll", () => {
      if (scrollProd.scrollTop + scrollProd.clientHeight >= scrollProd.scrollHeight - 50) {
        if (prodVisibleCount < currentFilteredProductos.length) {
          prodVisibleCount += 20;
          renderProductosModalLazy(true);
        }
      }
    });
  }
  
  const scrollDev = document.getElementById("scrollDevolucionesBuscador");
  if(scrollDev) {
    scrollDev.addEventListener("scroll", () => {
      if (scrollDev.scrollTop + scrollDev.clientHeight >= scrollDev.scrollHeight - 50) {
        if (devVisibleCount < currentFilteredDevoluciones.length) {
          devVisibleCount += 20;
          renderDevolucionesLazy(true);
        }
      }
    });
  }
});

const cerrarModalBuscarCliente = document.getElementById("cerrarModalBuscarCliente");
cerrarModalBuscarCliente?.addEventListener("click", () => {
  const m = document.getElementById("modalBuscarCliente");
  if (m) m.style.display = "none";
});

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
  

  const btnNuevo = document.getElementById("btnNuevoClienteDesdeBuscador");
  if (btnNuevo) {
    if (window.targetClientInput === 'clienteDevolucion') {
      btnNuevo.style.setProperty('display', 'none', 'important');
    } else {
      btnNuevo.style.setProperty('display', 'inline-block', 'important');
    }
  }

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


// ==========================================
// FIX HISTORIAL DE VENTAS LOGIC
// ==========================================
const btnVolverVentas = document.getElementById("btnVolverVentas");
if(btnVolverVentas) {
  btnVolverVentas.addEventListener("click", () => {
    document.getElementById("pos-container").style.display = "grid";
    document.getElementById("history-container").style.display = "none";
  });
}

const filtroFechaHistorial = document.getElementById("filtroFechaHistorial");
if(filtroFechaHistorial) {
  filtroFechaHistorial.addEventListener("change", () => {
    if(!filtroFechaHistorial.value) {
      // mostrar todo
      ventasCachePrincipal = ventasCacheModal;
      renderVentasPrincipal(ventasCachePrincipal);
      return;
    }
    const seleccion = filtroFechaHistorial.value; // YYYY-MM-DD
    const filtradas = ventasCacheModal.filter((v) => {
      if(!v.fecha) return false;
      return v.fecha.startsWith(seleccion);
    });
    ventasCachePrincipal = filtradas;
    renderVentasPrincipal(filtradas);
  });
}

// ==========================================
// AUTOCOMPLETE CLIENTES VENTA
// ==========================================
const clienteVentaNombreV = document.getElementById("clienteVentaNombre");
const autocompleteClientesV = document.getElementById("autocompleteClientes");
const clienteVentaV = document.getElementById("clienteVenta");

clienteVentaNombreV?.addEventListener("input", debounce(async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteClientesV) autocompleteClientesV.innerHTML = "";
  if (!q) {
    if(autocompleteClientesV) autocompleteClientesV.style.display = "none";
    if(clienteVentaV) clienteVentaV.value = "";
    
    // Si se borra, volver a consumidor final por defecto
    const cf = allClientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
    if (cf && clienteVentaV) {
      clienteVentaV.value = cf.id;
    }
    return;
  }
  
  if (!allClientes || allClientes.length === 0) {
    allClientes = await ClientesAPI.getAll(comercioId);
  }
  
  const filtrados = allClientes.filter(c => c.nombre.toLowerCase().includes(q) || c.documento?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteClientesV) autocompleteClientesV.style.display = "none";
    return;
  }
  filtrados.forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${escapeHtml(c.nombre)} ${c.documento ? '('+c.documento+')' : ''}`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(clienteVentaV) clienteVentaV.value = c.id;
      if(clienteVentaNombreV) clienteVentaNombreV.value = c.nombre;
      if(autocompleteClientesV) autocompleteClientesV.style.display = "none";
    });
    if(autocompleteClientesV) autocompleteClientesV.appendChild(li);
  });
  if(autocompleteClientesV) autocompleteClientesV.style.display = "block";
}, 300));

clienteVentaNombreV?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteClientesV) autocompleteClientesV.style.display = "none";
    // Si quedo vacio, consumidor final
    if (!clienteVentaNombreV.value.trim()) {
      const cf = allClientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
      if (cf && clienteVentaV && clienteVentaNombreV) {
        clienteVentaV.value = cf.id;
        clienteVentaNombreV.value = cf.nombre;
      }
    }
  }, 150);
});

// ==========================================
// AUTOCOMPLETE PRODUCTOS VENTA
// ==========================================
const productoVentaNombreV = document.getElementById("productoVentaNombre");
const autocompleteProductosV = document.getElementById("autocompleteProductos");
const productoVentaV = document.getElementById("productoVenta");
const cantidadVentaV = document.getElementById("cantidadVenta");

productoVentaNombreV?.addEventListener("input", debounce(async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteProductosV) autocompleteProductosV.innerHTML = "";
  if (!q) {
    if(autocompleteProductosV) autocompleteProductosV.style.display = "none";
    if(productoVentaV) productoVentaV.value = "";
    return;
  }
  
  if (!productosCache || productosCache.length === 0) {
    productosCache = await ProductosAPI.getAll(comercioId);
  }
  
  const filtrados = productosCache.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteProductosV) autocompleteProductosV.style.display = "none";
    return;
  }
  filtrados.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${escapeHtml(p.nombre)} - $${Number(p.precio_venta || p.precio).toFixed(2)}`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(productoVentaV) productoVentaV.value = p.id;
      if(productoVentaNombreV) productoVentaNombreV.value = p.nombre;
      if(autocompleteProductosV) autocompleteProductosV.style.display = "none";
      if(cantidadVentaV) cantidadVentaV.focus();
    });
    if(autocompleteProductosV) autocompleteProductosV.appendChild(li);
  });
  if(autocompleteProductosV) autocompleteProductosV.style.display = "block";
}, 300));

productoVentaNombreV?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteProductosV) autocompleteProductosV.style.display = "none";
  }, 150);
});

  const btnImprimirTicketHistorial = document.getElementById("btnImprimirTicketHistorial");
  if(btnImprimirTicketHistorial) {
    btnImprimirTicketHistorial.addEventListener("click", () => {
      const contenido = document.getElementById("ticketHistorialContenido")?.innerHTML || "";
      const ventana = window.open('', '_blank', 'width=300,height=500');
      ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
      ventana.document.write('<h3 style="text-align:center;">Comprobante de Venta</h3>');
      ventana.document.write(contenido);
      ventana.document.write('</body></html>');
      ventana.document.close();
      ventana.onload = () => {
        ventana.print();
        ventana.close();
      };
    });
  }
// ==========================================
// TICKET EXITO (Aceptar e Imprimir)
// ==========================================
const btnAceptarTicketExito = document.getElementById("btnAceptarTicketExito");
const modalTicketExito = document.getElementById("modalTicketExito");

if (btnAceptarTicketExito && modalTicketExito) {
  btnAceptarTicketExito.addEventListener("click", () => {
    modalTicketExito.style.display = "none";
  });
}

const btnImprimirTicketExito = document.getElementById("btnImprimirTicketExito");
if (btnImprimirTicketExito) {
  btnImprimirTicketExito.addEventListener("click", () => {
    const contenido = document.getElementById("ticketExitoContenido")?.innerHTML || "";
    const ventana = window.open('', '_blank', 'width=300,height=500');
    ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
    ventana.document.write('<h3 style="text-align:center;">Comprobante de Venta</h3>');
    ventana.document.write(contenido);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.onload = () => {
      ventana.print();
      ventana.close();
    };
  });
}

// ==========================================
// ATAJOS DE TECLADO (F2, F8, ENTER)
// ==========================================
document.addEventListener("keydown", (e) => {
  if (e.target && e.target.tagName && e.target.tagName.toLowerCase() === "textarea") return;

  if (e.key === "F2") {
    e.preventDefault();
    const pInput = document.getElementById("productoVentaNombre");
    if (pInput) {
      pInput.focus();
      pInput.select();
    }
  }

  if (e.key === "F8") {
    e.preventDefault();
    const formVentaF8 = document.querySelector(".app-form-venta");
    if (formVentaF8) {
      const btn = formVentaF8.querySelector("button[type='submit']");
      if (btn) btn.click();
    }
  }

  if (e.key === "Enter") {
    const modalTicket = document.getElementById("modalTicketExito");
    if (modalTicket && modalTicket.style.display === "flex") {
      e.preventDefault();
      const btn = document.getElementById("btnAceptarTicketExito");
      if (btn) btn.click();
      return;
    }

    if (document.activeElement && document.activeElement.id === "productoVentaNombre") {
      e.preventDefault();
      const btn = document.getElementById("btnAgregarProducto");
      if (btn) btn.click();
    }
  }
});
