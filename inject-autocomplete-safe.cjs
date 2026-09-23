const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const newLogic = `
// ==========================================
// AUTOCOMPLETE CLIENTES VENTA
// ==========================================
const clienteVentaNombreV = document.getElementById("clienteVentaNombre");
const autocompleteClientesV = document.getElementById("autocompleteClientes");
const clienteVentaV = document.getElementById("clienteVenta");

clienteVentaNombreV?.addEventListener("input", async (e) => {
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
    li.textContent = \`\${c.nombre} \${c.documento ? '('+c.documento+')' : ''}\`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(clienteVentaV) clienteVentaV.value = c.id;
      if(clienteVentaNombreV) clienteVentaNombreV.value = c.nombre;
      if(autocompleteClientesV) autocompleteClientesV.style.display = "none";
    });
    if(autocompleteClientesV) autocompleteClientesV.appendChild(li);
  });
  if(autocompleteClientesV) autocompleteClientesV.style.display = "block";
});

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

productoVentaNombreV?.addEventListener("input", async (e) => {
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
    li.textContent = \`\${p.nombre} - $\${Number(p.precio_venta || p.precio).toFixed(2)}\`;
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
});

productoVentaNombreV?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteProductosV) autocompleteProductosV.style.display = "none";
  }, 150);
});
`;

if (!js.includes('AUTOCOMPLETE CLIENTES VENTA')) {
  fs.writeFileSync('frontend/js/ventas.js', js + newLogic);
  console.log('Appended Venta autocompletes');
} else {
  console.log('Already injected');
}
