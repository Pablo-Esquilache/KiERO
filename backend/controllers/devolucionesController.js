import db from "../db.js";

/* =====================================================
   POST registrar devolución (POSTGRESQL)
===================================================== */
export const registrarDevolucion = async (req, res) => {
  const { venta_id, cliente_id,  items } = req.body;
  const comercio_id = req.user.comercio_id;

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id requerido" });

  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "Debe enviar productos a devolver" });

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let totalDevolucion = 0;
    

    // Si viene venta_id (Devolución vinculada, modelo antiguo)
    if (venta_id) {
      const ventaRes = await client.query(
        "SELECT id, metodo_pago FROM ventas WHERE id = $1 AND comercio_id = $2 FOR UPDATE",
        [venta_id, comercio_id]
      );
      if (!ventaRes.rows.length) throw new Error("Venta no encontrada");

      for (const item of items) {
        if (!item.cantidad || isNaN(item.cantidad) || Number(item.cantidad) <= 0 || !Number.isInteger(Number(item.cantidad))) {
          throw new Error("Cantidad inválida. Debe ser un entero positivo.");
        }
        const detalleRes = await client.query(
          "SELECT cantidad, precio_unitario, producto_nombre FROM ventas_detalle WHERE venta_id = $1 AND producto_id = $2 FOR UPDATE",
          [venta_id, item.producto_id]
        );
        if (!detalleRes.rows.length) throw new Error("Producto no pertenece a la venta");

        const cantidadVendida = Number(detalleRes.rows[0].cantidad);
        const devolucionesPrevias = await client.query(
           "SELECT COALESCE(SUM(dd.cantidad), 0) AS cant_devuelta FROM devoluciones_detalle dd JOIN devoluciones d ON d.id = dd.devolucion_id WHERE d.venta_id = $1 AND dd.producto_id = $2",
           [venta_id, item.producto_id]
        );
        const cantidadYaDevuelta = Number(devolucionesPrevias.rows[0].cant_devuelta);
        const cantidadDisponibleParaDevolver = cantidadVendida - cantidadYaDevuelta;

        if (item.cantidad > cantidadDisponibleParaDevolver) {
          throw new Error(`Cantidad mayor a la disponible. Quedan: ${cantidadDisponibleParaDevolver}.`);
        }
        item.precio = Number(detalleRes.rows[0].precio_unitario);
        item.nombre_db = detalleRes.rows[0].producto_nombre;
        totalDevolucion += item.precio * Number(item.cantidad);
        
        // Determinar si es de precio abierto para no sumar stock
        const prodRes = await client.query("SELECT precio_abierto, nombre FROM productos WHERE id = $1 AND comercio_id = $2", [item.producto_id, comercio_id]);
        if (!item.nombre_db && prodRes.rows.length) item.nombre_db = prodRes.rows[0].nombre;
        if (prodRes.rows.length && prodRes.rows[0].precio_abierto) {
           item.esPrecioAbierto = true;
        }
      }
    } else {
      // Devolucion Libre (modelo nuevo)
      for (const item of items) {
        const prodRes = await client.query(
          "SELECT precio, precio_abierto, nombre FROM productos WHERE id = $1 AND comercio_id = $2",
          [item.producto_id, comercio_id]
        );
        if (!prodRes.rows.length) throw new Error("Producto no encontrado en el catalogo");
        
        if (prodRes.rows[0].precio_abierto) {
          const precioCliente = Number(item.precio_unitario || item.precio);
          if (!Number.isFinite(precioCliente) || precioCliente === 0) throw new Error(`Precio invalido para "${item.nombre || item.producto_id}"`);
          item.precio = precioCliente;
          item.esPrecioAbierto = true;
        } else {
          item.precio = Number(prodRes.rows[0].precio);
          item.esPrecioAbierto = false;
        }
        item.nombre_db = prodRes.rows[0].nombre;
        
        totalDevolucion += item.precio * Number(item.cantidad);
      }
    }

    // 3. Insert cabecera
    const devolucionInsert = await client.query(
      `INSERT INTO devoluciones (venta_id, cliente_id, total, comercio_id, fecha)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [venta_id || null, cliente_id || null, totalDevolucion, comercio_id]
    );
    const devolucion = devolucionInsert.rows[0];

    // 4. Insert detalle + sumar stock
    for (const item of items) {
      const subtotal = item.precio * Number(item.cantidad);
      await client.query(
        "INSERT INTO devoluciones_detalle (devolucion_id, producto_id, cantidad, precio_unitario, subtotal, producto_nombre) VALUES ($1,$2,$3,$4,$5,$6)",
        [devolucion.id, item.producto_id, item.cantidad, item.precio, subtotal, item.nombre_db]
      );
      if (!item.esPrecioAbierto) {
            await client.query(
        "UPDATE productos SET stock = stock + $1 WHERE id = $2 AND comercio_id = $3",
        [item.cantidad, item.producto_id, comercio_id]
      );
      }
    }

    // 5. Compensacion de CC removida por requerimiento de Devolucion Libre sin metodo de pago

    await client.query("COMMIT");
    res.status(201).json({ success: true, devolucion_id: devolucion.id });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* =====================================================
   GET devoluciones por comercio
===================================================== */
export const getDevoluciones = async (req, res) => {
  const comercio_id = req.user.comercio_id;

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id requerido" });

  try {
    const { rows } = await db.query(
      `SELECT d.*, c.nombre AS cliente_nombre
      FROM devoluciones d
      LEFT JOIN clientes c ON d.cliente_id = c.id
      WHERE d.comercio_id = $1
      ORDER BY d.fecha DESC`,
      [comercio_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo devoluciones:", err);
    res.status(500).json({ error: "Error interno" });
  }
};

/* =====================================================
   GET detalle devolución
===================================================== */
export const getDetalleDevolucion = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `SELECT dd.*, COALESCE(dd.producto_nombre, p.nombre) AS producto_nombre
      FROM devoluciones_detalle dd
      LEFT JOIN productos p ON dd.producto_id = p.id
      JOIN devoluciones d ON dd.devolucion_id = d.id
      WHERE dd.devolucion_id = $1 AND d.comercio_id = $2
      `,
      [id, req.user.comercio_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo detalle de devolución:", err);
    res.status(500).json({ error: "Error interno" });
  }
};
