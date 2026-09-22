const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

js = js.replace('const clienteDevolucion = document.getElementById("clienteDevolucion");\n', '');
js = js.replace('const productoDevolucion = document.getElementById("productoDevolucion");\n', '');
js = js.replace('const cantidadDevolucion = document.getElementById("cantidadDevolucion");\n', '');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed duplicate const declarations');
