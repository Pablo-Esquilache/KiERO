const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ajustes.html', 'utf8');

// 1. Comment out E-commerce
const ecommerceRegex = /(<!-- 3\. E-COMMERCE -->[\s\S]*?<\/section>)/;
if (ecommerceRegex.test(html)) {
  html = html.replace(ecommerceRegex, '<!-- E-COMMERCE DESHABILITADO TEMPORALMENTE\n$1\n-->');
}

// 2. Change buttons in Sistema y Datos
html = html.replace(
  '<button id="refresh-db-btn" class="app-btn-secondary" title="Actualizar datos forzosamente">\n              🔄 Actualizar Tablas\n            </button>',
  '<button id="refresh-db-btn" class="app-btn-secondary" title="Comprobar el estado de la conexión">\n              🔄 Comprobar Conexión con BD\n            </button>'
);

fs.writeFileSync('frontend/pages/ajustes.html', html);
console.log('Modified ajustes.html');
