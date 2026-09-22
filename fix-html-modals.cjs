const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// 1. modalProductos
html = html.replace(/<div class="app-modal-content app-modal-productos">/, '<div class="app-modal-content app-modal-productos" style="max-width: 800px;">');
const prodModalMatch = /<div id="modalProductos" class="app-modal">[\s\S]*?<div class="app-tabla-container">/;
html = html.replace(prodModalMatch, (match) => match.replace('<div class="app-tabla-container">', '<div class="app-tabla-container" id="scrollProductosBuscador" style="max-height: 50vh; overflow-y: auto;">'));

// 2. modalBuscarCliente
html = html.replace(/<div id="modalBuscarCliente" class="app-modal" style="z-index: 10000;">\s*<div class="app-modal-content">/, '<div id="modalBuscarCliente" class="app-modal" style="z-index: 10000;">\n      <div class="app-modal-content" style="max-width: 800px;">');
const cliModalMatch = /<div id="modalBuscarCliente" class="app-modal" style="z-index: 10000;">[\s\S]*?<div class="app-tabla-container">/;
html = html.replace(cliModalMatch, (match) => match.replace('<div class="app-tabla-container">', '<div class="app-tabla-container" id="scrollClientesBuscador" style="max-height: 50vh; overflow-y: auto;">'));

// 3. modalVerDevoluciones
const devModalMatch = /<div id="modalVerDevoluciones" class="app-modal" style="z-index: 1000;">[\s\S]*?<div class="app-tabla-container">/;
html = html.replace(devModalMatch, (match) => match.replace('<div class="app-tabla-container">', '<div class="app-tabla-container" id="scrollDevolucionesBuscador" style="max-height: 50vh; overflow-y: auto;">'));

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed modals HTML');
