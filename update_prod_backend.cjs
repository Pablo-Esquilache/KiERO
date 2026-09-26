const fs = require('fs');
let js = fs.readFileSync('backend/controllers/productosController.js', 'utf8');

// Update createProducto
js = js.replace(/export const createProducto = async \(req, res\) => {/,
`export const createProducto = async (req, res) => {\n  const isAdmin = req.user.role === 'admin';\n  const precio_abierto = isAdmin ? (req.body.precio_abierto || false) : false;`);

js = js.replace(/INSERT INTO productos\s*\([^)]*\)\s*VALUES\s*\([^)]*\)/, 
  `INSERT INTO productos\n        (nombre, categoria, precio, stock, codigo_barras, comercio_id, precio_abierto)\n        VALUES ($1, $2, $3, $4, $5, $6, $7)`);

js = js.replace(/const { rows } = await db\.query\(query, \[\s*nombre,\s*categoria \|\| null,\s*precio,\s*stock \?\? 0,\s*codigo_barras \|\| null,\s*comercio_id\s*\]\);/,
  `const { rows } = await db.query(query, [\n        nombre,\n        categoria || null,\n        precio,\n        stock ?? 0,\n        codigo_barras || null,\n        comercio_id,\n        precio_abierto\n      ]);`);


// Update updateProducto
js = js.replace(/export const updateProducto = async \(req, res\) => {/,
`export const updateProducto = async (req, res) => {\n  const isAdmin = req.user.role === 'admin';`);

js = js.replace(/const query = `\s*UPDATE productos\s*SET nombre = \$1,\s*categoria = \$2,\s*precio = \$3,\s*stock = stock \+ COALESCE\(CAST\(\$4 AS INTEGER\), 0\),\s*codigo_barras = \$7\s*WHERE id = \$5 AND comercio_id = \$6\s*RETURNING \*\s*`;\s*const { rows } = await db\.query\(query, \[nombre, categoria, precio, stock, id, comercio_id, codigo_barras\]\);/,
`let query, params;
    if (isAdmin && req.body.precio_abierto !== undefined) {
      query = \`UPDATE productos SET nombre = $1, categoria = $2, precio = $3, stock = stock + COALESCE(CAST($4 AS INTEGER), 0), codigo_barras = $7, precio_abierto = $8 WHERE id = $5 AND comercio_id = $6 RETURNING *\`;
      params = [nombre, categoria, precio, stock, id, comercio_id, codigo_barras, req.body.precio_abierto];
    } else {
      query = \`UPDATE productos SET nombre = $1, categoria = $2, precio = $3, stock = stock + COALESCE(CAST($4 AS INTEGER), 0), codigo_barras = $7 WHERE id = $5 AND comercio_id = $6 RETURNING *\`;
      params = [nombre, categoria, precio, stock, id, comercio_id, codigo_barras];
    }
    const { rows } = await db.query(query, params);`);

fs.writeFileSync('backend/controllers/productosController.js', js);
console.log("Success backend prod replace");
