const fs = require('fs');
let js = fs.readFileSync('frontend/js/system.js', 'utf8');

js = js.replace(/ventasLink\\.innerHTML = "Ventas .*?\"/g, 'ventasLink.innerHTML = "Ventas \\uD83D\\uDD12"');
fs.writeFileSync('frontend/js/system.js', js);
console.log("system.js unicode updated");
