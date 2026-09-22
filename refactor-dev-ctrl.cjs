const fs = require('fs');
let code = fs.readFileSync('backend/controllers/devolucionesController.js', 'utf8');

const regexRegistrar = /export const registrarDevolucion = async \(req, res\) => \{[\s\S]*?res\.status\(400\)\.json\(\{ error: err\.message \}\);\n  \} finally \{\n    client\.release\(\);\n  \}\n\};/m;

const newRegistrar = `export const registrarDevolucion = async (req, res) => {
  const { venta_id, cliente_id, comercio_id, items, metodo_pago } = req.body;

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id es requerido" });

  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "Debe enviar productos a devolver" });

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let totalDevolucion = 0;
    let metodo = metodo_pago || "Efectivo";

    if (venta_id) {
      // 1️⃣ Validar venta original (Devolución vinculada)
      const ventaRes = await client.query(
        "SELECT id, metodo_pago FROM ventas WHERE id = $1 AND comercio_id = $2 FOR UPDATE",
        [venta_id, comercio_id],
      );

      if (!ventaRes.rows.length) throw new Error("Venta no encontrada");
      metodo = ventaRes.rows[0].metodo_pago;

      // 2️⃣ Validar productos contra la venta
      for (const item of items) {
        const detalleRes = await client.query(
          "SELECT cantidad, precio_unitario FROM ventas_detalle WHERE venta_id = $1 AND producto_id = $2 FOR UPDATE",
          [venta_id, item.producto_id],
        );
        if (!detalleRes.rows.length) throw new Error("Producto no pertenece a la venta");
        
        const cantidadVendida = Number(detalleRes.rows[0].cantidad);
        const devolucionesPrevias = await client.query(
           "SELECT COALESCE(SUM(dd.cantidad), 0) AS cant_devuelta FROM devoluciones_detalle dd JOIN devoluciones d ON d.id = dd.devolucion_id WHERE d.venta_id = $1 AND dd.producto_id = $2",
           [venta_id, item.producto_id]
        );
        const cantidadYaDevuelta = Number(devolucionesPrevias.rows[0].cant_devuelta);
        const disponibles = cantidadVendida - cantidadYaDevuelta;

        if (item.cantidad > disponibles) {
          throw new Error(\`Cantidad excede lo disponible. Original: \${cantidadVendida}, Ya devolvió: \${cantidadYaDevuelta}\`);
        }
        item.precio_resuelto = Number(detalleRes.rows[0].precio_unitario);
        totalDevolucion += item.precio_resuelto * Number(item.cantidad);
      }
    } else {
      // Devolución Libre (sin tique)
      for (const item of items) {
        // En devolución libre el front debe mandar el precio o lo buscamos del catálogo
        const prodRes = await client.query("SELECT precio FROM productos WHERE id = $1 AND comercio_id = $2", [item.producto_id, comercio_id]);
        if (!prodRes.rows.length) throw new Error("Producto no encontrado");
        item.precio_resuelto = item.precio || Number(prodRes.rows[0].precio);
        totalDevolucion += item.precio_resuelto * Number(item.cantidad);
      }
    }

    // 3️⃣ Insert cabecera (cliente_id y venta_id pueden ser null)
    const devolucionInsert = await client.query(
      "INSERT INTO devoluciones (venta_id, cliente_id, total, comercio_id, fecha, metodo_pago) VALUES ($1,$2,$3,$4,NOW(),$5) RETURNING *",
      [venta_id || null, cliente_id || null, totalDevolucion, comercio_id, metodo],
    );
    const devolucion = devolucionInsert.rows[0];

    // 4️⃣ Insert detalle + sumar stock
    for (const item of items) {
      const subtotal = item.precio_resuelto * Number(item.cantidad);
      await client.query(
        "INSERT INTO devoluciones_detalle (devolucion_id, producto_id, cantidad, precio_unitario, subtotal) VALUES ($1,$2,$3,$4,$5)",
        [devolucion.id, item.producto_id, item.cantidad, item.precio_resuelto, subtotal],
      );
      await client.query(
        "UPDATE productos SET stock = stock + $1 WHERE id = $2 AND comercio_id = $3",
        [item.cantidad, item.producto_id, comercio_id],
      );
    }

    // 5️⃣ Si el método es cuenta corriente, abonar saldo compensatorio como "pago"
    if (metodo === 'Cuenta Corriente' && cliente_id) {
      await client.query(
        "INSERT INTO cuenta_corriente_movimientos (cliente_id, comercio_id, tipo, monto, venta_id) VALUES ($1, $2, 'pago', $3, $4)",
        [cliente_id, comercio_id, totalDevolucion, venta_id || null]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ success: true, devolucion_id: devolucion.id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};`;

code = code.replace(regexRegistrar, newRegistrar);
fs.writeFileSync('backend/controllers/devolucionesController.js', code);
console.log('Fixed devolucionesController');
