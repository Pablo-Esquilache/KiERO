const fs = require('fs');
let js = fs.readFileSync('backend/controllers/ventasController.js', 'utf8');

js = js.replace(/`SELECT stock, precio FROM productos\s*WHERE id = \$1 AND comercio_id = \$2`,/,
  `\`SELECT stock, precio, precio_abierto FROM productos \n           WHERE id = $1 AND comercio_id = $2\`,`);

js = js.replace(/if \(item\.cantidad > Number\(rows\[0\]\.stock\)\)\s*throw new Error\("Stock insuficiente"\);\s*\/\/ Override client price to prevent manipulation\s*item\.precio_unitario = Number\(rows\[0\]\.precio\);/,
`if (rows[0].precio_abierto) {
          const precioCliente = Number(item.precio_unitario);
          if (!Number.isFinite(precioCliente) || precioCliente <= 0) throw new Error(\`Precio inválido para "\${item.nombre}"\`);
          item.precio_unitario = precioCliente;
          item.esPrecioAbierto = true;
        } else {
          if (item.cantidad > Number(rows[0].stock)) throw new Error("Stock insuficiente");
          item.precio_unitario = Number(rows[0].precio);
          item.esPrecioAbierto = false;
        }`);

js = js.replace(/const updateRes = await client\.query\(\s*`\s*UPDATE productos\s*SET stock = stock - \$1\s*WHERE id = \$2 AND comercio_id = \$3 AND stock >= \$1\s*RETURNING stock\s*`,\s*\[item\.cantidad, item\.producto_id, comercio_id\],\s*\);\s*if \(updateRes\.rowCount === 0\)\s*throw new Error\("Stock insuficiente durante actualización"\);/g,
`if (!item.esPrecioAbierto) {
          const updateRes = await client.query(
            \`
            UPDATE productos
            SET stock = stock - $1
            WHERE id = $2 AND comercio_id = $3 AND stock >= $1
            RETURNING stock
            \`,
            [item.cantidad, item.producto_id, comercio_id],
          );
          if (updateRes.rowCount === 0) throw new Error("Stock insuficiente durante actualización");
        }`);

js = js.replace(/const updateRes = await client\.query\(\s*`\s*UPDATE productos\s*SET stock = stock - \$1\s*WHERE id = \$2 AND comercio_id = \$3\s*`,\s*\[item\.cantidad, item\.producto_id, comercio_id\],\s*\);/g,
`if (!item.esPrecioAbierto) {
          await client.query(
            \`
            UPDATE productos
            SET stock = stock - $1
            WHERE id = $2 AND comercio_id = $3
            \`,
            [item.cantidad, item.producto_id, comercio_id],
          );
        }`);

fs.writeFileSync('backend/controllers/ventasController.js', js);
console.log("Success backend ventas replace");
