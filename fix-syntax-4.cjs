const fs = require('fs');
let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

js = js.replace(/\}\/\$\{m\}\/\$\{y\}`;/, '');
// Also replace `}/${m}/${y}`;` which doesn't have a brace in front of it? Wait, the line is `}/${m}/${y}`;`
js = js.replace(/\}\/\$\{m\}\/\$\{y\}`;/, ''); // Maybe it has a newline?
js = js.replace('}/${m}/${y}`;', ''); 

fs.writeFileSync('frontend/js/gastos.js', js);
console.log('Fixed formatFecha syntax');
