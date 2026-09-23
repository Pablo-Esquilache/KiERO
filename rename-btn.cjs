const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ajustes.html', 'utf8');

html = html.replace(
  '<button id="refresh-db-btn" class="app-btn-secondary" title="Actualizar datos forzosamente">\n              🔄 Actualizar Tablas\n            </button>',
  '<button id="refresh-db-btn" class="app-btn-secondary" title="Comprobar el estado de la conexión">\n              🔄 Comprobar Conexión con BD\n            </button>'
);
fs.writeFileSync('frontend/pages/ajustes.html', html);
console.log('Fixed button label');
