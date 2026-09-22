const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const missingLogic = `
// ==========================================
// NUEVA LÓGICA DEVOLUCIONES LIBRES (RESTORED)
// ==========================================
const btnCrearDevolucionLeft = document.getElementById("btnCrearDevolucionLeft");
const clienteDevolucionNombre = document.getElementById("clienteDevolucionNombre");
const autocompleteClientesDevolucion = document.getElementById("autocompleteClientesDevolucion");
const productoDevolucionNombre = document.getElementById("productoDevolucionNombre");
const autocompleteProductosDevolucion = document.getElementById("autocompleteProductosDevolucion");
const clienteDevolucion = document.getElementById("clienteDevolucion");
const productoDevolucion = document.getElementById("productoDevolucion");
const cantidadDevolucion = document.getElementById("cantidadDevolucion");
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
clienteDevolucionNombre?.addEventListener("input", async (e) => {
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
    li.textContent = \`\${c.nombre} (\${c.documento || '-'})\`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(clienteDevolucion) clienteDevolucion.value = c.id;
      if(clienteDevolucionNombre) clienteDevolucionNombre.value = c.nombre;
      if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
    });
    if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.appendChild(li);
  });
  if(autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "block";
});

clienteDevolucionNombre?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteClientesDevolucion) autocompleteClientesDevolucion.style.display = "none";
  }, 150);
});

// Autocomplete Productos Devolucion
productoDevolucionNombre?.addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.innerHTML = "";
  if (!q) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
    if(productoDevolucion) productoDevolucion.value = "";
    return;
  }
  const filtrados = productosCache.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
    return;
  }
  filtrados.forEach(p => {
    const li = document.createElement("li");
    li.textContent = \`\${p.nombre} - $\${Number(p.precio).toFixed(2)}\`;
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
});

productoDevolucionNombre?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteProductosDevolucion) autocompleteProductosDevolucion.style.display = "none";
  }, 150);
});
`;

if (!js.includes('btnCrearDevolucionLeft?.addEventListener("click"')) {
  // Insert it before the formDevolucionNuevo block so variables are available
  const insertIndex = js.indexOf('const formDevolucionNuevo');
  if (insertIndex !== -1) {
    js = js.substring(0, insertIndex) + missingLogic + '\n\n' + js.substring(insertIndex);
  } else {
    js += missingLogic;
  }
}

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Restored autocomplete block');
