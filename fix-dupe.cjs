const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

js = js.replace(/const btnNuevo = document\.getElementById\("btnNuevoClienteDesdeBuscador"\);\n\s*if \(btnNuevo\) \{\n\s*if \(window\.targetClientInput === 'clienteDevolucion'\) \{\n\s*btnNuevo\.style\.setProperty\('display', 'none', 'important'\);\n\s*\} else \{\n\s*btnNuevo\.style\.setProperty\('display', 'inline-block', 'important'\);\n\s*\}\n\s*\}/, '');

fs.writeFileSync('frontend/js/ventas.js', js);
