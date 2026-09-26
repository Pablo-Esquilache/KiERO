const fs = require('fs');
let js = fs.readFileSync('frontend/js/productos.js', 'utf8');

// Inside abrirModal, after resetting form
js = js.replace(/productoEditandoId = null;\n\s*document\.getElementById\("formProducto"\)\.reset\(\);\n\s*\}/, 
`productoEditandoId = null;
    document.getElementById("formProducto").reset();
  }
  const currentUser = JSON.parse(localStorage.getItem("session") || "{}");
  if (currentUser.role === "admin") {
    document.getElementById("containerPrecioAbierto").style.display = "flex";
  }`);

// Inside abrirModal, when editing
js = js.replace(/document\.getElementById\("codigoBarrasProducto"\)\.value = producto\.codigo_barras \|\| "";/, 
`document.getElementById("codigoBarrasProducto").value = producto.codigo_barras || "";
    if (document.getElementById("precioAbiertoProducto")) {
       document.getElementById("precioAbiertoProducto").checked = producto.precio_abierto === true;
    }`);

// Inside submit form
js = js.replace(/codigo_barras:\s*document\.getElementById\("codigoBarrasProducto"\)\.value,/,
`codigo_barras: document.getElementById("codigoBarrasProducto").value,
    precio_abierto: document.getElementById("precioAbiertoProducto")?.checked || false,`);

fs.writeFileSync('frontend/js/productos.js', js);
console.log("Success JS replace");
