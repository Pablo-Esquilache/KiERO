const fs = require('fs');

// 1. Get the exact modal HTML from clientes.html
const clientesHtml = fs.readFileSync('frontend/pages/clientes.html', 'utf8');
const modalRegex = /<!-- MODAL -->\s*<div id="app-modal" class="app-modal">([\s\S]*?)<\/form>\s*<\/div>\s*<\/div>/;
const match = clientesHtml.match(modalRegex);
if (!match) {
  console.log("Could not find modal in clientes.html");
  process.exit(1);
}

const modalInner = match[1] + '</form>\n        </div>\n';

// 2. Read ventas.html and replace modalClienteRapido
let ventasHtml = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const targetRegex = /<!-- MODAL CREAR CLIENTE COMPLETO -->\s*<div id="modalClienteRapido" class="app-modal" style="z-index: 15000;">[\s\S]*?<\/form>\s*<\/div>\s*<\/div>/;

const newModalVentas = `<!-- MODAL CREAR CLIENTE COMPLETO -->
      <div id="modalClienteRapido" class="app-modal" style="z-index: 15000;">
${modalInner.replace('<button type="button" class="app-close">Cerrar</button>', '<button type="button" class="app-close" id="cerrarModalClienteRapido">Cerrar</button>')}
      </div>`;

if (ventasHtml.match(targetRegex)) {
  ventasHtml = ventasHtml.replace(targetRegex, newModalVentas);
  fs.writeFileSync('frontend/pages/ventas.html', ventasHtml);
  console.log("Replaced modal in ventas.html");
} else {
  console.log("Could not find target modal in ventas.html");
}
