const fs = require('fs');

// 1. Backend Controller
let ctrl = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');
ctrl = ctrl.replace(
    "AND (estado = 'abierta' OR fecha = CURRENT_DATE)",
    "AND (estado = 'abierta' OR fecha = COALESCE($2::date, CURRENT_DATE))"
);
ctrl = ctrl.replace(
    "[comercioId],",
    "[comercioId, req.query.fecha || null],"
);
fs.writeFileSync('backend/controllers/cajasController.js', ctrl);
console.log('Fixed backend controller');

// 2. API JS
let api = fs.readFileSync('frontend/js/api.js', 'utf8');
api = api.replace(
    'getHoy: (comercioId) => apiFetch(`/cajas/hoy/${comercioId}`),',
    'getHoy: (comercioId) => apiFetch(`/cajas/hoy/${comercioId}?fecha=${new Date().toLocaleDateString("sv-SE")}`),'
);
fs.writeFileSync('frontend/js/api.js', api);
console.log('Fixed api.js');

// 3. Ventas JS and System JS also call getHoy. They use the same api.js so they are fine!

