const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

const regex = /document\.getElementById\("btnDescargarDetalle"\)\.addEventListener\("click", \(\) => \{[\s\S]*?XLSX\.writeFile\(wb, \`detalle_venta_\$\{ventaActualDetalle\}\.xlsx\`\);\n\}\);/m;

js = js.replace(regex, '');

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Removed btnDescargarDetalle block');
