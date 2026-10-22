import { emitirComprobanteAfip } from "../services/fiscalService.js";
import db from "../db.js";
import { resolverFechaMovimiento } from "../utils/fechas.js";

/* =====================================================
   GET ventas (tickets) por comercio
===================================================== */
export const getVentas = async (req, res) => {
  const comercio_id = req.user.comercio_id;

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id requerido" });

  try {
    const { rows } = await db.query(
      `
      SELECT v.*, c.nombre AS cliente_nombre
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.comercio_id = $1
      ORDER BY v.fecha DESC, v.id DESC
      LIMIT 50
      `,
      [comercio_id],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/* =====================================================
   🔹 GET venta individual (NUEVO - NECESARIO PARA EDITAR)
===================================================== */
export const getVentaById = async (req, res) => {
  const { id } = req.params;
  const comercioId = req.user.comercio_id;

  try {
    const { rows } = await db.query(
      `
      SELECT v.*, c.nombre AS cliente_nombre, c.cuit AS cliente_cuit, c.condicion_iva AS cliente_condicion_iva, c.domicilio_fiscal AS cliente_domicilio_fiscal
      FROM ventas v
      LEFT JOIN clientes c ON v.cliente_id = c.id
      WHERE v.id = $1 AND v.comercio_id = $2
      `,
      [id, comercioId],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Venta no encontrada" });

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/* =====================================================
   GET detalle de una venta
===================================================== */
export const getVentaDetalle = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await db.query(
      `
      SELECT vd.*, COALESCE(vd.producto_nombre, p.nombre) AS producto_nombre
      FROM ventas_detalle vd
      LEFT JOIN productos p ON vd.producto_id = p.id
      WHERE vd.venta_id = $1
      `,
      [id],
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/* =====================================================
   POST crear venta
===================================================== */
export const createVenta = async (req, res) => {
  let {
    fecha,
    cliente_id,
    metodo_pago,
    descuento_porcentaje = 0, 
    items,
    facturar_afip = false,
    tipo_comprobante = "Ticket"
  } = req.body;
  const comercio_id = req.user.comercio_id;

  const hoyStr = new Date().toLocaleDateString("sv-SE");
  if (fecha === hoyStr) {
    fecha = new Date().toISOString();
  }

  const descuento = Number(descuento_porcentaje) || 0;
  if (descuento < 0 || descuento > 100) {
    return res.status(400).json({ error: "El descuento debe estar entre 0 y 100" });
  }

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id requerido" });

  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "Debe enviar items" });

  // 1️⃣ Validar productos y stock previo (AFUERA de la transacción para no bloquear conexiones compartidas)
  for (const item of items) {
    if (!item.cantidad || isNaN(item.cantidad) || Number(item.cantidad) <= 0 || !Number.isInteger(Number(item.cantidad))) {
      return res.status(400).json({ error: "Cantidad inválida. Debe ser un entero positivo." });
    }
    if (item.esPrecioAbierto && (isNaN(item.precio_unitario) || Number(item.precio_unitario) < 0)) {
      return res.status(400).json({ error: "Precio abierto inválido. No puede ser negativo." });
    }
    const { rows } = await db.query(
      `SELECT stock, precio, precio_abierto, nombre, alicuota_iva FROM productos 
         WHERE id = $1 AND comercio_id = $2`,
      [item.producto_id, comercio_id]
    );

    if (!rows[0]) return res.status(404).json({ error: `Producto con ID ${item.producto_id} no encontrado` });
    item.nombre_db = rows[0].nombre;
    item.alicuota_iva = rows[0].alicuota_iva !== undefined ? rows[0].alicuota_iva : 21.0;
    if (rows[0].precio_abierto) {
      const precioCliente = Number(item.precio_unitario);
      if (!Number.isFinite(precioCliente) || precioCliente <= 0) {
        return res.status(400).json({ error: `Precio inválido para "${rows[0].nombre}"` });
      }
      item.precio_unitario = precioCliente;
      item.esPrecioAbierto = true;
    } else {
      if (item.cantidad > Number(rows[0].stock)) {
        return res.status(400).json({ error: `Stock insuficiente para "${rows[0].nombre}". Stock actual: ${rows[0].stock}` });
      }
      item.precio_unitario = Number(rows[0].precio);
      item.esPrecioAbierto = false;
    }
  }

  // 2️⃣ Calcular totales
  let total_bruto = 0;
  for (const item of items) {
    total_bruto += Number(item.precio_unitario) * Number(item.cantidad);
  }
  const descuento_monto = total_bruto * (descuento / 100);
  const total = Math.round((total_bruto - descuento_monto) * 100) / 100;

  // 3️⃣ Si se solicitó Factura Electrónica, llamar a AFIP AFUERA de la transacción SQLite
  let fiscalData = null;
  if (facturar_afip) {
    try {
      fiscalData = await emitirComprobanteAfip({
        comercioId: comercio_id,
        clienteId: cliente_id,
        items,
        descuentoPorcentaje: descuento,
        totalVenta: total
      });

      if (!fiscalData.ok && !fiscalData.indeterminate) {
        return res.status(400).json({
          error: `AFIP rechazó la emisión: ${fiscalData.error || "Comprobante rechazado"}`,
          afip_rechazado: true,
          observaciones: fiscalData.observaciones
        });
      }
    } catch (fErr) {
      console.error("[VENTAS] Error emitiendo comprobante fiscal en AFIP:", fErr);
      return res.status(400).json({
        error: `Error fiscal AFIP/ARCA: ${fErr.message}`,
        fiscal_error: true
      });
    }
  }

  // 4️⃣ Transacción local atómica corta (apenas unos milisegundos en SQLite)
  const client = await db.connect();
  try {
    await client.query("BEGIN");

    const qVenta = `
      INSERT INTO ventas
        (fecha, cliente_id, metodo_pago, total_bruto,
         descuento_monto, descuento_porcentaje, total, comercio_id,
         tipo_comprobante, punto_venta, numero_comprobante, cae, vto_cae,
         resultado_afip, observaciones_afip, codigo_qr_afip)
      VALUES (NOW(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `;

    const { rows: vRows } = await client.query(qVenta, [
      cliente_id,
      metodo_pago,
      total_bruto,
      descuento_monto,
      descuento,
      total,
      comercio_id,
      fiscalData ? fiscalData.tipo_comprobante : (tipo_comprobante || "Ticket"),
      fiscalData ? fiscalData.punto_venta : null,
      fiscalData ? fiscalData.numero_comprobante : null,
      fiscalData ? fiscalData.cae : null,
      fiscalData ? fiscalData.vto_cae : null,
      fiscalData ? fiscalData.resultado : "NO_FISCAL",
      fiscalData ? fiscalData.observaciones : null,
      fiscalData ? fiscalData.codigo_qr_afip : null
    ]);

    const venta = vRows[0];

    // Insertar detalles + descontar stock con control de concurrencia
    for (const item of items) {
      const subtotal = Math.round(Number(item.precio_unitario) * Number(item.cantidad) * 100) / 100;

      await client.query(
        `INSERT INTO ventas_detalle
          (venta_id, producto_id, cantidad, precio_unitario, subtotal, producto_nombre)
          VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          venta.id,
          item.producto_id,
          item.cantidad,
          item.precio_unitario,
          subtotal,
          item.nombre_db
        ]
      );

      if (!item.esPrecioAbierto) {
        const updateRes = await client.query(
          `UPDATE productos
            SET stock = stock - $1
            WHERE id = $2 AND comercio_id = $3 AND stock >= $1
            RETURNING stock`,
          [item.cantidad, item.producto_id, comercio_id]
        );
        if (!updateRes.rows[0]) throw new Error("Stock insuficiente (Error de concurrencia)");
      }
    }

    // Registrar en cuenta corriente si aplica
    if (metodo_pago === "Cuenta Corriente" && cliente_id) {
      await client.query(
        `INSERT INTO cuenta_corriente_movimientos
          (cliente_id, tipo, monto, venta_id, comercio_id)
          VALUES ($1, 'venta', $2, $3, $4)`,
        [cliente_id, total, venta.id, comercio_id]
      );
    }

    await client.query("COMMIT");

    // Adjuntar QR data URL en memoria para impresión inmediata
    if (fiscalData && fiscalData.qr_data_url) {
      venta.qr_data_url = fiscalData.qr_data_url;
    }

    res.status(201).json(venta);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error en transacción de venta:", err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* =====================================================
   PUT actualizar venta
===================================================== */
export const updateVenta = async (req, res) => {
  const { id } = req.params;
  let {
    fecha,
    cliente_id,
    metodo_pago,
    descuento_porcentaje = 0, 
    items,
  } = req.body;
  const comercio_id = req.user.comercio_id;
  // Si la fecha enviada es "hoy", le inyectamos la hora actual exacta.
  // Esto evita que PostgreSQL la guarde como 00:00:00 (lo cual la deja fuera del horario de la Caja actual).
  const fechaFinal = resolverFechaMovimiento(fecha);


  const descuento = Number(descuento_porcentaje) || 0;
  if (descuento < 0 || descuento > 100) {
    return res.status(400).json({ error: "El descuento debe estar entre 0 y 100" });
  }

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id requerido" });

  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: "Debe enviar items" });

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 🔹 Validar existencia de venta
    const { rows: ventaExistente } = await client.query(
      `SELECT id FROM ventas WHERE id = $1 AND comercio_id = $2`,
      [id, comercio_id],
    );

    if (!ventaExistente.length) throw new Error("Venta no encontrada");

    // 1️⃣ Obtener detalles anteriores
    const { rows: detallesAnteriores } = await client.query(
      `SELECT vd.producto_id, vd.cantidad, p.precio_abierto
         FROM ventas_detalle vd
         JOIN productos p ON p.id = vd.producto_id
         WHERE vd.venta_id = $1`,
      [id],
    );

    // 2️⃣ Restaurar stock anterior
    for (const item of detallesAnteriores) {
        if (item.precio_abierto) continue;
        await client.query(
          `
          UPDATE productos
          SET stock = stock + $1
          WHERE id = $2 AND comercio_id = $3
          `,
          [item.cantidad, item.producto_id, comercio_id],
        );
      }

    // 3️⃣ Eliminar detalles anteriores
    await client.query(`DELETE FROM ventas_detalle WHERE venta_id = $1`, [id]);

    // 4️⃣ Verificar stock nuevo
    for (const item of items) {
        if (!item.cantidad || isNaN(item.cantidad) || Number(item.cantidad) <= 0 || !Number.isInteger(Number(item.cantidad))) {
          throw new Error("Cantidad inválida. Debe ser un entero positivo.");
        }
        if (item.esPrecioAbierto && (isNaN(item.precio_unitario) || Number(item.precio_unitario) < 0)) {
          throw new Error("Precio abierto inválido. No puede ser negativo.");
        }
        const { rows } = await client.query(
          `SELECT stock, precio, precio_abierto, nombre FROM productos
           WHERE id = $1 AND comercio_id = $2`,
          [item.producto_id, comercio_id],
        );
  
        if (!rows[0]) throw new Error("Producto no encontrado");
        item.nombre_db = rows[0].nombre;
        
        if (rows[0].precio_abierto) {
            item.esPrecioAbierto = true;
            const precioCliente = Number(item.precio_unitario);
            if (!Number.isFinite(precioCliente) || precioCliente === 0) {
                throw new Error("Precio inválido para producto comodín");
            }
            item.precio_unitario = precioCliente;
        } else {
            if (item.cantidad > Number(rows[0].stock))
              throw new Error("Stock insuficiente");
              
            item.precio_unitario = Number(rows[0].precio);
        }
      }

    // 5️⃣ Calcular totales nuevos
    let total_bruto = 0;
    for (const item of items) {
      total_bruto += Number(item.precio_unitario) * Number(item.cantidad);
    }

    const descuento_monto = total_bruto * (descuento / 100);

    const total = total_bruto - descuento_monto;

    // 6️⃣ Actualizar cabecera
    await client.query(
      `
      UPDATE ventas
      SET fecha = COALESCE($1, NOW()),
          cliente_id = $2,
          metodo_pago = $3,
          total_bruto = $4,
          descuento_monto = $5,
          descuento_porcentaje = $6,
          total = $7
      WHERE id = $8 AND comercio_id = $9
      `,
      [
        fechaFinal,
        cliente_id,
        metodo_pago,
        total_bruto,
        descuento_monto,
        descuento,
        total,
          id,
          comercio_id
        ],
      );

    // 7️⃣ Insertar nuevos detalles y descontar stock
    for (const item of items) {
      const subtotal = Number(item.precio_unitario) * Number(item.cantidad);

      await client.query(
        `
        INSERT INTO ventas_detalle
        (venta_id, producto_id, cantidad, precio_unitario, subtotal, producto_nombre)
        VALUES ($1,$2,$3,$4,$5,$6)
        `,
        [id, item.producto_id, item.cantidad, item.precio_unitario, subtotal, item.nombre_db],
      );

      if (!item.esPrecioAbierto) {
          await client.query(
            `
            UPDATE productos
            SET stock = stock - $1
            WHERE id = $2 AND comercio_id = $3
            `,
            [item.cantidad, item.producto_id, comercio_id],
          );
        }
    }

    await client.query("COMMIT");
    res.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

/* =====================================================
   DELETE venta
===================================================== */
export const deleteVenta = async (req, res) => {
  const { id } = req.params;
  const comercio_id = req.user.comercio_id;

  if (!comercio_id)
    return res.status(400).json({ error: "comercio_id requerido" });

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    // 1️⃣ Obtener datos de la venta
    const { rows: ventaRows } = await client.query(
      `SELECT cliente_id, metodo_pago, total
       FROM ventas
       WHERE id = $1 AND comercio_id = $2`,
      [id, comercio_id],
    );

    if (!ventaRows.length) throw new Error("Venta no encontrada");

    const venta = ventaRows[0];

    // 2️⃣ Restaurar stock
    const { rows: detalles } = await client.query(
      `SELECT producto_id, cantidad
       FROM ventas_detalle
       WHERE venta_id = $1`,
      [id],
    );

    for (const item of detalles) {
      await client.query(
        `
        UPDATE productos
        SET stock = stock + $1
        WHERE id = $2 AND comercio_id = $3
        `,
        [item.cantidad, item.producto_id, comercio_id],
      );
    }

    // 3️⃣ Eliminar devoluciones asociadas
    const { rows: devoluciones } = await client.query(
      `SELECT id FROM devoluciones WHERE venta_id = $1`,
      [id]
    );

    for (const dev of devoluciones) {
      await client.query(`DELETE FROM devoluciones_detalle WHERE devolucion_id = $1`, [dev.id]);
    }
    await client.query(`DELETE FROM devoluciones WHERE venta_id = $1`, [id]);

    // 4️⃣ Eliminar movimientos de cuenta corriente si era cuenta corriente
    if (venta.metodo_pago === "Cuenta Corriente") {
      await client.query(
        `
        DELETE FROM cuenta_corriente_movimientos
        WHERE venta_id = $1
        `,
        [id],
      );
    }

    // 4️⃣ Eliminar detalles
    await client.query(`DELETE FROM ventas_detalle WHERE venta_id = $1`, [id]);

    // 5️⃣ Eliminar venta
    await client.query(
      `DELETE FROM ventas WHERE id = $1 AND comercio_id = $2`,
      [id, comercio_id],
    );

    await client.query("COMMIT");
    res.status(204).end();
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

