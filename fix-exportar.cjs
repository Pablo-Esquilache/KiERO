const fs = require('fs');

let reportesJS = fs.readFileSync('frontend/js/reportes.js', 'utf8');

reportesJS = reportesJS.replace(
  'const res = await fetch(`${API_BASE}/exportar-tabla?tabla=${tabla}`);',
  'const session = JSON.parse(localStorage.getItem("session"));\n      const comercioId = session?.comercio_id;\n      const res = await fetch(`${API_BASE}/exportar-tabla?tabla=${tabla}&comercio_id=${comercioId}`);'
);

fs.writeFileSync('frontend/js/reportes.js', reportesJS);


let exportarJS = fs.readFileSync('backend/controllers/exportarController.js', 'utf8');

exportarJS = exportarJS.replace(
  'const { tabla } = req.query;',
  'const { tabla, comercio_id } = req.query;\n  if (!comercio_id) return res.status(400).json({ error: "comercio_id requerido" });'
);

exportarJS = exportarJS.replace(
  'query = "SELECT * FROM ventas";',
  'query = "SELECT * FROM ventas WHERE comercio_id = $1";'
);
exportarJS = exportarJS.replace(
  'query = "SELECT * FROM clientes";',
  'query = "SELECT * FROM clientes WHERE comercio_id = $1";'
);
exportarJS = exportarJS.replace(
  'query = "SELECT * FROM productos";',
  'query = "SELECT * FROM productos WHERE comercio_id = $1";'
);
exportarJS = exportarJS.replace(
  'query = "SELECT * FROM gastos";',
  'query = "SELECT * FROM gastos WHERE comercio_id = $1";'
);

exportarJS = exportarJS.replace(
  'const { rows } = await db.query(query);',
  'const { rows } = await db.query(query, [comercio_id]);'
);

fs.writeFileSync('backend/controllers/exportarController.js', exportarJS);
console.log('Fixed exportar logic and security vulnerability');
