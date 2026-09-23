const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

js = js.replace(/    \}\);\n  \}\n\}\);\n\nconst cerrarModalBuscarCliente/g, '    });\n  }\n\nconst cerrarModalBuscarCliente');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Removed extra });');
