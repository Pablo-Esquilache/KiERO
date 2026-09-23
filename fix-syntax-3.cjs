const fs = require('fs');
let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

js = js.replace(/  \}\/\$\{m\}\/\$\{y\}`;/, '');
js = js.replace(/  \}-\$\{mm\}-\$\{dd\}`;/, '');

fs.writeFileSync('frontend/js/gastos.js', js);
console.log('Fixed syntax issues manually.');
