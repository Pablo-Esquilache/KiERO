import pool from "../db.js";

/**
 * GET - Obtener caja del día actual
 */
export const getCajaHoy = async (req, res) => {
  const { comercioId } = req.params;

  try {
    // Modificado para traer la caja de hoy, o una caja anterior que siga abierta
    const { rows } = await pool.query(
      `SELECT * FROM cajas 
       WHERE comercio_id = $1 
       AND (estado = 'abierta' OR fecha = COALESCE($2::date, CURRENT_DATE))
       ORDER BY fecha DESC LIMIT 1`,
      [comercioId, req.query.fecha || null],
    );

    res.json(rows[0] || null);
  } catch (err) {
    if (err.code === "23505") {
      try {
         const reabrir = await pool.query(
           "UPDATE cajas SET estado = 'abierta', hora_cierre = NULL WHERE comercio_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE) RETURNING *",
           [comercio_id, (fecha && fecha.length === 10) ? fecha : null]
         );
         if (reabrir.rowCount > 0) {
           return res.json(reabrir.rows[0]);
         }
      } catch (e) {
         console.error("Error reabriendo:", e);
      }
      return res.status(400).json({ error: "La caja ya existe y no se pudo reabrir." });
    }
    console.error("Error abriendo caja:", err);
    res.status(500).json({ error: "Error abriendo caja" });
  }
};

/**
 * PUT - Cerrar caja
 */
export const cerrarCaja = async (req, res) => {
  const { id } = req.params;
  const { total_ventas, total_gastos, total_devoluciones, total_resultado, total_cuenta_corriente } =
    req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE cajas
       SET estado = 'cerrada',
           hora_cierre = NOW(),
           total_ventas = $1,
           total_gastos = $2,
           total_devoluciones = $3,
           total_resultado = $4,
           total_cuenta_corriente = $5
       WHERE id = $6
       RETURNING *`,
      [total_ventas, total_gastos, total_devoluciones, total_resultado, total_cuenta_corriente || 0, id],
    );

    res.json(rows[0]);
  } catch (err) {
    console.error("Error cerrando caja:", err);
    res.status(500).json({ error: "Error cerrando caja" });
  }
};

/**
 * GET - Movimientos del día para caja
 */
export const getMovimientosDia = async (req, res) => {
  const { comercioId } = req.params;

  try {
    const cajaQuery = await pool.query(
      `SELECT hora_apertura, hora_cierre FROM cajas 
       WHERE comercio_id = $1 
       AND (estado = 'abierta' OR fecha = CURRENT_DATE)
       ORDER BY fecha DESC LIMIT 1`,
      [comercioId]
    );

    let startTime = null;
    let endTime = null;

    if (cajaQuery.rows.length > 0) {
      startTime = cajaQuery.rows[0].hora_apertura;
      endTime = cajaQuery.rows[0].hora_cierre;
    } else {
      const hoy = new Date();
      hoy.setHours(0,0,0,0);
      startTime = hoy.toISOString();
    }

    const baseParams = endTime ? [comercioId, startTime, endTime] : [comercioId, startTime];
    const timeCondition = endTime ? `AND fecha >= $2 AND fecha <= $3` : `AND fecha >= $2`;
    const dTimeCondition = endTime ? `AND d.fecha >= $2 AND d.fecha <= $3` : `AND d.fecha >= $2`;

    const ventas = await pool.query(
      `SELECT id, fecha, total, metodo_pago
       FROM ventas
       WHERE comercio_id = $1
       ${timeCondition}`,
      baseParams
    );

    const gastos = await pool.query(
      `SELECT id, fecha, importe, descripcion
       FROM gastos
       WHERE comercio_id = $1
       ${timeCondition}`,
      baseParams
    );

    const devoluciones = await pool.query(
      `SELECT d.id, d.fecha, d.total, v.metodo_pago
       FROM devoluciones d
       LEFT JOIN ventas v ON v.id = d.venta_id
       WHERE d.comercio_id = $1
       ${dTimeCondition}`,
      baseParams
    );

    let movimientos = [];

    ventas.rows.forEach((v) => {
      movimientos.push({
        hora: v.fecha,
        tipo: 'VENTA',
        descripcion: `Venta - ${v.metodo_pago}`,
        metodo_pago: v.metodo_pago,
        ingreso: Number(v.total),
        egreso: 0,
      });
    });

    gastos.rows.forEach((g) => {
      movimientos.push({
        hora: g.fecha,
        tipo: 'GASTO',
        descripcion: g.descripcion,
        metodo_pago: 'Efectivo',
        ingreso: 0,
        egreso: Number(g.importe),
      });
    });

    devoluciones.rows.forEach((d) => {
      movimientos.push({
        hora: d.fecha,
        tipo: 'DEVOLUCION',
        descripcion: `Devolución - ${d.metodo_pago}`,
        metodo_pago: d.metodo_pago,
        ingreso: 0,
        egreso: Number(d.total),
      });
    });

    movimientos.sort((a, b) => new Date(b.hora) - new Date(a.hora));

    let t = {
      efectivo: 0,
      digital: 0,
      cuenta_corriente: 0,
      egresos: 0,
      devoluciones: 0,
    };

    ventas.rows.forEach((v) => {
      const tot = Number(v.total);
      if (v.metodo_pago === 'Efectivo') t.efectivo += tot;
      else if (v.metodo_pago === 'Cuenta Corriente') t.cuenta_corriente += tot;
      else t.digital += tot;
    });

    gastos.rows.forEach((g) => {
      t.egresos += Number(g.importe);
    });

    devoluciones.rows.forEach((d) => {
      t.devoluciones += Number(d.total);
    });

    res.json({ movimientos, totales: t });
  } catch (err) {
    console.error('Error obteniendo movimientos:', err);
    res.status(500).json({ error: 'Error obteniendo movimientos' });
  }
};

/**
 * GET - Historial de cajas
 */
export const getHistorial = async (req, res) => {
  const { comercioId } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT * FROM cajas 
       WHERE comercio_id = $1 
       ORDER BY fecha DESC`,
      [comercioId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error obteniendo historial de cajas:", err);
    res.status(500).json({ error: "Error obteniendo historial" });
  }
};
