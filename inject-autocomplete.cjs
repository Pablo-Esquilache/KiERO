const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const anchor = '// Autocomplete Clientes Devolucion';

const newLogic = `
// Autocomplete Clientes Venta
const clienteVentaNombre = document.getElementById("clienteVentaNombre");
const autocompleteClientes = document.getElementById("autocompleteClientes");
const clienteVenta = document.getElementById("clienteVenta");

clienteVentaNombre?.addEventListener("input", async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteClientes) autocompleteClientes.innerHTML = "";
  if (!q) {
    if(autocompleteClientes) autocompleteClientes.style.display = "none";
    if(clienteVenta) clienteVenta.value = "";
    
    // Si se borra, volver a consumidor final por defecto
    const cf = allClientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
    if (cf && clienteVenta) {
      clienteVenta.value = cf.id;
    }
    return;
  }
  
  if (!allClientes || allClientes.length === 0) {
    allClientes = await ClientesAPI.getAll(comercioId);
  }
  
  const filtrados = allClientes.filter(c => c.nombre.toLowerCase().includes(q) || c.documento?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteClientes) autocompleteClientes.style.display = "none";
    return;
  }
  filtrados.forEach(c => {
    const li = document.createElement("li");
    li.textContent = \`\${c.nombre} \${c.documento ? '('+c.documento+')' : ''}\`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(clienteVenta) clienteVenta.value = c.id;
      if(clienteVentaNombre) clienteVentaNombre.value = c.nombre;
      if(autocompleteClientes) autocompleteClientes.style.display = "none";
    });
    if(autocompleteClientes) autocompleteClientes.appendChild(li);
  });
  if(autocompleteClientes) autocompleteClientes.style.display = "block";
});

clienteVentaNombre?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteClientes) autocompleteClientes.style.display = "none";
    // Si quedó vacío, consumidor final
    if (!clienteVentaNombre.value.trim()) {
      const cf = allClientes.find(c => c.nombre && c.nombre.toLowerCase().includes('consumidor'));
      if (cf && clienteVenta && clienteVentaNombre) {
        clienteVenta.value = cf.id;
        clienteVentaNombre.value = cf.nombre;
      }
    }
  }, 150);
});

// Autocomplete Productos Venta
const productoVentaNombre = document.getElementById("productoVentaNombre");
const autocompleteProductos = document.getElementById("autocompleteProductos");
const productoVenta = document.getElementById("productoVenta");
const cantidadVenta = document.getElementById("cantidadVenta");

productoVentaNombre?.addEventListener("input", async (e) => {
  const q = e.target.value.toLowerCase().trim();
  if(autocompleteProductos) autocompleteProductos.innerHTML = "";
  if (!q) {
    if(autocompleteProductos) autocompleteProductos.style.display = "none";
    if(productoVenta) productoVenta.value = "";
    return;
  }
  
  if (!productosCache || productosCache.length === 0) {
    productosCache = await ProductosAPI.getAll(comercioId);
  }
  
  const filtrados = productosCache.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo_barras?.includes(q)).slice(0, 10);
  if (filtrados.length === 0) {
    if(autocompleteProductos) autocompleteProductos.style.display = "none";
    return;
  }
  filtrados.forEach(p => {
    const li = document.createElement("li");
    li.textContent = \`\${p.nombre} - $\${p.precio_venta}\`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      if(productoVenta) productoVenta.value = p.id;
      if(productoVentaNombre) productoVentaNombre.value = p.nombre;
      if(autocompleteProductos) autocompleteProductos.style.display = "none";
      if(cantidadVenta) cantidadVenta.focus();
    });
    if(autocompleteProductos) autocompleteProductos.appendChild(li);
  });
  if(autocompleteProductos) autocompleteProductos.style.display = "block";
});

productoVentaNombre?.addEventListener("blur", () => {
  setTimeout(() => {
    if (autocompleteProductos) autocompleteProductos.style.display = "none";
  }, 150);
});

// Autocomplete Clientes Devolucion`;

if (!js.includes('Autocomplete Clientes Venta')) {
  js = js.replace(anchor, newLogic);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('Injected Venta autocompletes');
} else {
  console.log('Already injected');
}

