const fs = require('fs');

// 1. Clean system.js
let sysJs = fs.readFileSync('frontend/js/system.js', 'utf8');
sysJs = sysJs.replace('ventasLink.style.backgroundColor = "#444";', '');
sysJs = sysJs.replace('ventasLink.style.color = "#888";', '');
fs.writeFileSync('frontend/js/system.js', sysJs);
console.log("system.js cleaned");

// 2. Clean ventas.js
let venJs = fs.readFileSync('frontend/js/ventas.js', 'utf8');
venJs = venJs.replace('navItem.style.backgroundColor = "#555";', '');
venJs = venJs.replace('navItem.style.color = "#ccc";', '');
fs.writeFileSync('frontend/js/ventas.js', venJs);
console.log("ventas.js cleaned");
