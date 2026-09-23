const fs = require('fs');

let js = fs.readFileSync('frontend/js/reportes.js', 'utf8');

js = js.replace(/const API_BASE = "http:\/\/localhost:4000\/api";/g, 'const API_BASE = "/api";');

fs.writeFileSync('frontend/js/reportes.js', js);
console.log('Fixed hardcoded localhost URL');
