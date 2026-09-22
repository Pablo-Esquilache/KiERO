const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// The new buttons
js += `
// ==========================================
// NUEVA LÓGICA DEVOLUCIONES LIBRES
// ==========================================
const btnCrearDevolucionLeft = document.getElementById("btnCrearDevolucionLeft");
const clienteDevolucionNombre = document.getElementById("clienteDevolucionNombre");
const autocompleteClientesDevolucion = document.getElementById("autocompleteClientesDevolucion");
const productoDevolucionNombre = document.getElementById("productoDevolucionNombre");
const autocompleteProductosDevolucion = document.getElementById("autocompleteProductosDevolucion");
const metodoPagoDevolucion = document.getElementById("metodoPagoDevolucion");

// Open modal from new left button
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
clienteDevolucionNombre?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  autocompleteClientesDevolucion.innerHTML = "";
  if (!q) {
    autocompleteClientesDevolucion.style.display = "none";
    clienteDevolucion.value = "";
    return;
  }
  const filtrados = clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.documento.includes(q));
  if (filtrados.length === 0) {
    autocompleteClientesDevolucion.style.display = "none";
    return;
  }
  filtrados.forEach(c => {
    const li = document.createElement("li");
    li.textContent = \`\${c.nombre} (\${c.documento})\`;
    li.addEventListener("click", () => {
      clienteDevolucion.value = c.id;
      clienteDevolucionNombre.value = c.nombre;
      autocompleteClientesDevolucion.style.display = "none";
    });
    autocompleteClientesDevolucion.appendChild(li);
  });
  autocompleteClientesDevolucion.style.display = "block";
});

// Autocomplete Productos Devolucion
productoDevolucionNombre?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  autocompleteProductosDevolucion.innerHTML = "";
  if (!q) {
    autocompleteProductosDevolucion.style.display = "none";
    productoDevolucion.value = "";
    return;
  }
  const filtrados = productos.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q));
  if (filtrados.length === 0) {
    autocompleteProductosDevolucion.style.display = "none";
    return;
  }
  filtrados.forEach(p => {
    const li = document.createElement("li");
    li.textContent = \`\${p.nombre} - $\${Number(p.precio).toFixed(2)}\`;
    li.addEventListener("click", () => {
      productoDevolucion.value = p.id;
      productoDevolucionNombre.value = p.nombre;
      autocompleteProductosDevolucion.style.display = "none";
      // Auto-set cantidad to 1
      if(cantidadDevolucion) cantidadDevolucion.value = 1;
    });
    autocompleteProductosDevolucion.appendChild(li);
  });
  autocompleteProductosDevolucion.style.display = "block";
});

// Hide autocompletes on click outside
document.addEventListener("click", (e) => {
  if (e.target !== clienteDevolucionNombre) {
    if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
  }
  if (e.target !== productoDevolucionNombre) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
  }
});

// Add to cart modified for free products (we don't check venta_id anymore)
const btnAgregarDevolucionNuevo = document.getElementById("btnAgregarDevolucion");
btnAgregarDevolucionNuevo?.addEventListener("click", () => {
  const prodId = productoDevolucion?.value;
  const cant = Number(cantidadDevolucion?.value);
  
  if (!prodId) {
    alert("Seleccioná un producto de la lista");
    return;
  }
  if (!cant || cant <= 0) {
    alert("Ingresá una cantidad válida");
    return;
  }
  
  const prodObj = productos.find(p => p.id == prodId);
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
const formDevolucionNuevo = document.getElementById("formDevolucion");
formDevolucionNuevo?.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  if (carritoDevolucion.length === 0) {
    alert("El carrito de devolución está vacío");
    return;
  }
  
  const cliId = document.getElementById("clienteDevolucion")?.value || null;
  const metPago = document.getElementById("metodoPagoDevolucion")?.value || "Efectivo";
  
  const payload = {
    comercio_id: comercioId,
    cliente_id: cliId, // Puede ser null, el backend lo aceptará si quitamos el constraint
    venta_id: null, // Ya no lo usamos en debolucion libre
    metodo_pago: metPago,
    items: carritoDevolucion
  };
  
  try {
    const res = await fetch("/api/devoluciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.token },
      body: JSON.stringify(payload)
    });
    
    if(!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al generar devolución");
    }
    
    alert("Devolución generada con éxito");
    carritoDevolucion = [];
    renderCarritoDevolucion();
    
    if (clienteDevolucion) clienteDevolucion.value = "";
    if (clienteDevolucionNombre) clienteDevolucionNombre.value = "";
    
    document.getElementById("modalDevolucion").style.display = "none";
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
});
`;

// In order to avoid conflicts with the OLD formDevolucion submit, I need to strip the old one
const oldFormSubmitRegex = /document\.getElementById\("formDevolucion"\)\?.addEventListener\("submit", async \(e\) => \{[\s\S]*?await cargarVentas\(\);\n  \}\);/m;
js = js.replace(oldFormSubmitRegex, '// OLD FORM SUBMIT REMOVED');

const oldAgregarDevRegex = /document\.getElementById\("btnAgregarDevolucion"\)\?.addEventListener\("click", \(\) => \{[\s\S]*?cantidadDevolucion\.value = "";\n  \}\);/m;
js = js.replace(oldAgregarDevRegex, '// OLD AGREGAR REMOVED');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Appended new Dev logic');
