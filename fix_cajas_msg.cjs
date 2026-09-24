const fs = require('fs');
let t = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');
t = t.replace(\n  /\"Error interno al abrir caja\" /g,\n  '\"Error interno al abrir caja: \" + err.message'\n);
fs.writeFileSync('backend/controllers/cajasController.js', t);