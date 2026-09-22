const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

const regex = /document\s*\.getElementById\("btnCuentaCorriente"\)\s*\.addEventListener\("click", async \(\) => \{[\s\S]*?modalCC\.style\.display = "flex";\s*\}\);/m;

js = js.replace(regex, '');

fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Removed btnCuentaCorriente listener');
