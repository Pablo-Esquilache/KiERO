const fs = require('fs');
let js = fs.readFileSync('backend/controllers/devolucionesController.js', 'utf8');

js = js.replace(/const prodRes = await client\.query\(\s*"SELECT precio FROM productos WHERE id = \\\$1 AND comercio_id = \\\$2",\s*\[item\.producto_id, comercio_id\]\s*\);\s*if \(\!prodRes\.rows\.length\) throw new Error\("Producto no encontrado en el catálogo"\);\s*item\.precio = Number\(prodRes\.rows\[0\]\.precio\);/g,
`const prodRes = await client.query(
          "SELECT precio, precio_abierto FROM productos WHERE id = $1 AND comercio_id = $2",
          [item.producto_id, comercio_id]
        );
        if (!prodRes.rows.length) throw new Error("Producto no encontrado en el catálogo");
        
        if (prodRes.rows[0].precio_abierto) {
           const precioCliente = Number(item.precio_unitario || item.precio);
           if (!Number.isFinite(precioCliente) || precioCliente <= 0) throw new Error("Precio inválido para devolución libre de comodín");
           item.precio = precioCliente;
           item.esPrecioAbierto = true;
        } else {
           item.precio = Number(prodRes.rows[0].precio);
           item.esPrecioAbierto = false;
        }`);

js = js.replace(/await client\.query\(\s*"UPDATE productos SET stock = stock \+ \\\$1 WHERE id = \\\$2 AND comercio_id = \\\$3",\s*\[item\.cantidad, item\.producto_id, comercio_id\]\s*\);/g,
`if (!item.esPrecioAbierto) {
        await client.query(
          "UPDATE productos SET stock = stock + $1 WHERE id = $2 AND comercio_id = $3",
          [item.cantidad, item.producto_id, comercio_id]
        );
      }`);

fs.writeFileSync('backend/controllers/devolucionesController.js', js);
console.log("Success backend dev replace");
