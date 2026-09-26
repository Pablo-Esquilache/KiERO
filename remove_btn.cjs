const fs = require('fs');

// 1. Remove from HTML
let html = fs.readFileSync('frontend/pages/ajustes.html', 'utf8');
html = html.replace(/<button id="refresh-db-btn".*?<\/button>/s, '');
fs.writeFileSync('frontend/pages/ajustes.html', html);

// 2. Remove from system.js
let js = fs.readFileSync('frontend/js/system.js', 'utf8');
js = js.replace(/const refreshBtn = document\.getElementById\("refresh-db-btn"\);[\s\S]*?refreshBtn\.textContent = textoOriginal;\s*}\s*}\);/s, '');
fs.writeFileSync('frontend/js/system.js', js);

// 3. Remove from api.js
let api = fs.readFileSync('frontend/js/api.js', 'utf8');
api = api.replace(/refreshDb: \(\) => apiFetch\("\/system\/refresh-db"\),/g, '');
fs.writeFileSync('frontend/js/api.js', api);

console.log("Button removed successfully");
