import express from "express";
import pool from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  validarCuit,
  saveCertificates,
  checkCertificates,
  verificarEstadoAfip,
} from "../services/fiscalService.js";

const router = express.Router();

// --- MÉTODOS DE PAGO ---

// Obtener métodos de pago
router.get("/metodos_pago/:comercioId", async (req, res) => {
  const { comercioId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM metodos_pago WHERE comercio_id = $1 ORDER BY id ASC",
      [comercioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Agregar método de pago
router.post("/metodos_pago", requireAdmin, async (req, res) => {
  const { comercio_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO metodos_pago (comercio_id, nombre) VALUES ($1, $2) RETURNING *",
      [comercio_id, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al agregar método de pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Toggle activo método de pago
router.put("/metodos_pago/:id/toggle", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE metodos_pago SET activo = $1 WHERE id = $2 RETURNING *",
      [activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar método de pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Eliminar método de pago
router.delete("/metodos_pago/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM metodos_pago WHERE id = $1", [id]);
    res.json({ message: "Eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar método de pago:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// --- DESCUENTOS ---

// Obtener descuentos
router.get("/descuentos/:comercioId", async (req, res) => {
  const { comercioId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM descuentos_config WHERE comercio_id = $1 ORDER BY porcentaje ASC",
      [comercioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener descuentos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Agregar descuento
router.post("/descuentos", requireAdmin, async (req, res) => {
  const { comercio_id, porcentaje } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO descuentos_config (comercio_id, porcentaje) VALUES ($1, $2) RETURNING *",
      [comercio_id, porcentaje]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al agregar descuento:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Toggle activo descuento
router.put("/descuentos/:id/toggle", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE descuentos_config SET activo = $1 WHERE id = $2 RETURNING *",
      [activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar descuento:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Eliminar descuento
router.delete("/descuentos/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM descuentos_config WHERE id = $1", [id]);
    res.json({ message: "Eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar descuento:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// --- CATEGORIAS DE GASTOS ---

router.get("/gastos_categorias/:comercioId", async (req, res) => {
  const { comercioId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM gastos_categorias WHERE comercio_id = $1 ORDER BY id ASC",
      [comercioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener categorías de gastos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.post("/gastos_categorias", requireAdmin, async (req, res) => {
  const { comercio_id, nombre } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO gastos_categorias (comercio_id, nombre) VALUES ($1, $2) RETURNING *",
      [comercio_id, nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al agregar categoría de gastos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.put("/gastos_categorias/:id/toggle", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const result = await pool.query(
      "UPDATE gastos_categorias SET activo = $1 WHERE id = $2 RETURNING *",
      [activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar categoría de gastos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.delete("/gastos_categorias/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM gastos_categorias WHERE id = $1", [id]);
    res.json({ message: "Eliminado con éxito" });
  } catch (error) {
    console.error("Error al eliminar categoría de gastos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// --- UMBRAL STOCK ---

router.put("/umbral_stock/:comercioId", requireAdmin, async (req, res) => {
  const { comercioId } = req.params;
  const { umbral_stock } = req.body;
  try {
    await pool.query("UPDATE comercios SET umbral_stock = $1 WHERE id = $2", [umbral_stock, comercioId]);
    res.json({ message: "Umbral actualizado exitosamente" });
  } catch (error) {
    console.error("Error al actualizar umbral de stock:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// --- TURNOS CONFIG ---

router.get("/turnos_config/:comercioId", async (req, res) => {
  const { comercioId } = req.params;
  try {
    let result = await pool.query("SELECT * FROM turnos_config WHERE comercio_id = $1", [comercioId]);
    
    if (result.rows.length === 0) {
      result = await pool.query(
        "INSERT INTO turnos_config (comercio_id) VALUES ($1) RETURNING *",
        [comercioId]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al obtener configuracion de turnos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

router.put("/turnos_config/:comercioId", requireAdmin, async (req, res) => {
  const { comercioId } = req.params;
  const { modulo_habilitado, hora_inicio_laboral, hora_fin_laboral, intervalo_minutos, permitir_solapamiento } = req.body;
  try {
    const result = await pool.query(
      `UPDATE turnos_config 
       SET modulo_habilitado = COALESCE($1, modulo_habilitado), 
           hora_inicio_laboral = COALESCE($2, hora_inicio_laboral), 
           hora_fin_laboral = COALESCE($3, hora_fin_laboral), 
           intervalo_minutos = COALESCE($4, intervalo_minutos), 
           permitir_solapamiento = COALESCE($5, permitir_solapamiento)
       WHERE comercio_id = $6 RETURNING *`,
      [modulo_habilitado, hora_inicio_laboral, hora_fin_laboral, intervalo_minutos, permitir_solapamiento, comercioId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar configuracion de turnos:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});


// ==========================================
// AUMENTO MASIVO DE PRECIOS
// ==========================================

// Previsualizar cantidad de productos a aumentar
router.get("/aumento-masivo/previsualizar/:comercioId", requireAdmin, async (req, res) => {
  const { comercioId } = req.params;
  const proveedor = req.query.proveedor || "TODOS";
  try {
    const result = await pool.query(
      `SELECT count(*) as count 
       FROM productos 
       WHERE comercio_id = $1 
         AND (precio_abierto IS NULL OR precio_abierto = 0)
         AND ($2 = 'TODOS' OR proveedor = $2)`,
      [comercioId, proveedor]
    );
    res.json({ count: result.rows[0].count });
  } catch (error) {
    console.error("Error al previsualizar aumento:", error);
    res.status(500).json({ error: "Error al previsualizar aumento" });
  }
});

// Aplicar aumento masivo con registro en log
router.post("/aumento-masivo", requireAdmin, async (req, res) => {
  const { comercio_id, proveedor = "TODOS", porcentaje, tipo_redondeo = "centavo" } = req.body;
  const usuario_id = req.user?.id || null;

  const pct = parseFloat(porcentaje);
  if (isNaN(pct) || pct <= 0) {
    return res.status(400).json({ error: "Porcentaje de aumento inválido" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Obtener los productos afectados (excluyendo comodines/precio_abierto)
    const { rows: productos } = await client.query(
      `SELECT id, precio, nombre, proveedor 
       FROM productos 
       WHERE comercio_id = $1 
         AND (precio_abierto IS NULL OR precio_abierto = 0)
         AND ($2 = 'TODOS' OR proveedor = $2)`,
      [comercio_id, proveedor]
    );

    if (productos.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No hay productos para actualizar con los criterios seleccionados." });
    }

    // 2. Calcular precios nuevos aplicando redondeo y resguardando precios de $0
    const factor = 1 + (pct / 100);
    const detalles = [];

    for (const p of productos) {
      const precioAnterior = Number(p.precio) || 0;
      const rawNew = precioAnterior * factor;
      let finalPrice;

      if (tipo_redondeo === "decena") {
        finalPrice = Math.round(rawNew / 10) * 10;
        // Si el redondeo a la decena da $0 (ej: $4 * 1.10 = 4.4 -> 0), fallback al centavo
        if (finalPrice <= 0) {
          finalPrice = Math.round(rawNew * 100) / 100;
        }
      } else if (tipo_redondeo === "peso") {
        finalPrice = Math.round(rawNew);
        if (finalPrice <= 0) {
          finalPrice = Math.round(rawNew * 100) / 100;
        }
      } else {
        // centavo
        finalPrice = Math.round(rawNew * 100) / 100;
      }

      detalles.push({
        producto_id: p.id,
        precio_anterior: precioAnterior,
        precio_nuevo: finalPrice
      });
    }

    // 3. Crear cabecera de log
    const { rows: logRows } = await client.query(
      `INSERT INTO log_aumentos_precios 
        (comercio_id, usuario_id, proveedor, porcentaje, tipo_redondeo, cantidad_productos) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [comercio_id, usuario_id, proveedor, pct, tipo_redondeo, detalles.length]
    );
    const logId = logRows[0].id;

    // 4. Guardar detalles y actualizar precios de los productos
    for (const d of detalles) {
      await client.query(
        `INSERT INTO log_aumentos_precios_detalle 
          (log_id, producto_id, precio_anterior, precio_nuevo) 
         VALUES ($1, $2, $3, $4)`,
        [logId, d.producto_id, d.precio_anterior, d.precio_nuevo]
      );

      await client.query(
        `UPDATE productos 
         SET precio = $1 
         WHERE id = $2 AND comercio_id = $3`,
        [d.precio_nuevo, d.producto_id, comercio_id]
      );
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      mensaje: `Se actualizaron ${detalles.length} productos exitosamente.`,
      cantidad_actualizada: detalles.length,
      log_id: logId
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error aplicando aumento masivo:", error);
    res.status(500).json({ error: "Error interno al aplicar aumento masivo" });
  } finally {
    client.release();
  }
});

// Obtener el último aumento activo que se puede revertir
router.get("/ultimo-aumento/:comercioId", requireAdmin, async (req, res) => {
  const { comercioId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM log_aumentos_precios 
       WHERE comercio_id = $1 AND revertido = 0 
       ORDER BY id DESC LIMIT 1`,
      [comercioId]
    );
    res.json(rows[0] || null);
  } catch (error) {
    console.error("Error obteniendo último aumento:", error);
    res.status(500).json({ error: "Error al obtener último aumento" });
  }
});

// Revertir el último aumento masivo
router.post("/revertir-aumento", requireAdmin, async (req, res) => {
  const { comercio_id, log_id } = req.body;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verificar que el log exista, pertenezca al comercio y no esté revertido
    const { rows: logRows } = await client.query(
      `SELECT * FROM log_aumentos_precios 
       WHERE id = $1 AND comercio_id = $2 AND revertido = 0`,
      [log_id, comercio_id]
    );

    if (logRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "El aumento no existe, no pertenece a este comercio o ya fue revertido." });
    }

    // Obtener detalle y verificar precio actual
    const { rows: detalles } = await client.query(
      `SELECT d.producto_id, d.precio_anterior, d.precio_nuevo, p.precio as precio_actual 
       FROM log_aumentos_precios_detalle d
       JOIN productos p ON p.id = d.producto_id
       WHERE d.log_id = $1 AND p.comercio_id = $2`,
      [log_id, comercio_id]
    );

    let revertidos = 0;
    for (const item of detalles) {
      // Regla de seguridad: solo revertir si el precio actual sigue siendo el precio_nuevo generado por el aumento
      // (si alguien lo editó manualmente después, no pisamos su cambio manual)
      if (Number(item.precio_actual) === Number(item.precio_nuevo)) {
        await client.query(
          `UPDATE productos SET precio = $1 WHERE id = $2 AND comercio_id = $3`,
          [item.precio_anterior, item.producto_id, comercio_id]
        );
        revertidos++;
      }
    }

    // Marcar como revertido
    await client.query(
      `UPDATE log_aumentos_precios SET revertido = 1 WHERE id = $1`,
      [log_id]
    );

    await client.query("COMMIT");
    res.json({
      success: true,
      mensaje: `Aumento revertido exitosamente. Se restauraron los precios de ${revertidos} productos (de ${detalles.length} originales).`,
      revertidos
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error revirtiendo aumento:", error);
    res.status(500).json({ error: "Error interno al revertir aumento" });
  } finally {
    client.release();
  }
});


// --- CONFIGURACIÓN FISCAL AFIP / ARCA ---

// Obtener configuración fiscal (sin exponer llaves privadas ni rutas locales)
router.get("/fiscal/:comercioId", requireAdmin, async (req, res) => {
  const { comercioId } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT cuit, punto_venta, condicion_iva, ambiente, certificado_cargado, clave_privada_cargada, vencimiento_certificado, created_at, updated_at
       FROM configuracion_fiscal
       WHERE comercio_id = $1`,
      [comercioId]
    );

    const certStatus = checkCertificates(comercioId);

    if (rows.length === 0) {
      return res.json({
        cuit: "",
        punto_venta: 1,
        condicion_iva: "Monotributo",
        ambiente: "homologacion",
        certificado_cargado: certStatus.hasCert ? 1 : 0,
        clave_privada_cargada: certStatus.hasKey ? 1 : 0,
        vencimiento_certificado: certStatus.vencimiento,
        expirado: certStatus.expirado,
        configurado: false,
      });
    }

    const row = rows[0];
    res.json({
      cuit: row.cuit || "",
      punto_venta: row.punto_venta || 1,
      condicion_iva: row.condicion_iva || "Monotributo",
      ambiente: row.ambiente || "homologacion",
      certificado_cargado: certStatus.hasCert ? 1 : (row.certificado_cargado ? 1 : 0),
      clave_privada_cargada: certStatus.hasKey ? 1 : (row.clave_privada_cargada ? 1 : 0),
      vencimiento_certificado: certStatus.vencimiento || row.vencimiento_certificado,
      expirado: certStatus.expirado,
      configurado: !!(row.cuit && certStatus.hasCert && certStatus.hasKey),
    });
  } catch (error) {
    console.error("Error al obtener configuración fiscal:", error);
    res.status(500).json({ error: "Error interno al obtener configuración fiscal" });
  }
});

// Guardar configuración fiscal (guarda cert y key en userData/fiscal, guarda flags en DB)
router.post("/fiscal", requireAdmin, async (req, res) => {
  const {
    comercio_id,
    cuit,
    punto_venta,
    condicion_iva,
    ambiente,
    certificado_texto,
    clave_privada_texto,
  } = req.body;

  if (!comercio_id || !cuit) {
    return res.status(400).json({ error: "comercio_id y CUIT son obligatorios" });
  }

  const valCuit = validarCuit(cuit);
  if (!valCuit.valid) {
    return res.status(400).json({ error: `CUIT inválido: ${valCuit.error}` });
  }

  try {
    let vencimiento = null;
    if (certificado_texto || clave_privada_texto) {
      const saveRes = saveCertificates(comercio_id, certificado_texto, clave_privada_texto);
      vencimiento = saveRes.vencimiento;
    }

    const certStatus = checkCertificates(comercio_id);
    const ptoVta = parseInt(punto_venta, 10) || 1;
    const condIva = condicion_iva || "Monotributo";
    const amb = ambiente === "produccion" ? "produccion" : "homologacion";
    const certCargado = certStatus.hasCert ? 1 : 0;
    const keyCargada = certStatus.hasKey ? 1 : 0;
    const vencimientoFinal = vencimiento || certStatus.vencimiento || null;

    await pool.query(
      `INSERT INTO configuracion_fiscal
        (comercio_id, cuit, punto_venta, condicion_iva, ambiente, certificado_cargado, clave_privada_cargada, vencimiento_certificado, updated_at)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, datetime('now','localtime'))
       ON CONFLICT(comercio_id) DO UPDATE SET
        cuit = excluded.cuit,
        punto_venta = excluded.punto_venta,
        condicion_iva = excluded.condicion_iva,
        ambiente = excluded.ambiente,
        certificado_cargado = excluded.certificado_cargado,
        clave_privada_cargada = excluded.clave_privada_cargada,
        vencimiento_certificado = COALESCE(excluded.vencimiento_certificado, configuracion_fiscal.vencimiento_certificado),
        updated_at = datetime('now','localtime')`,
      [
        comercio_id,
        valCuit.formatted,
        ptoVta,
        condIva,
        amb,
        certCargado,
        keyCargada,
        vencimientoFinal,
      ]
    );

    res.json({
      success: true,
      mensaje: "Configuración fiscal guardada correctamente.",
      config: {
        cuit: valCuit.formatted,
        punto_venta: ptoVta,
        condicion_iva: condIva,
        ambiente: amb,
        certificado_cargado: certCargado,
        clave_privada_cargada: keyCargada,
        vencimiento_certificado: vencimientoFinal,
        expirado: certStatus.expirado,
        configurado: !!(valCuit.formatted && certCargado && keyCargada),
      },
    });
  } catch (error) {
    console.error("Error al guardar configuración fiscal:", error);
    res.status(500).json({ error: error.message || "Error al guardar configuración fiscal" });
  }
});

// Probar conexión y estado con AFIP
router.post("/fiscal/test", requireAdmin, async (req, res) => {
  const { comercio_id } = req.body;
  if (!comercio_id) {
    return res.status(400).json({ error: "comercio_id requerido" });
  }

  try {
    const estado = await verificarEstadoAfip(comercio_id);
    res.json(estado);
  } catch (error) {
    console.error("Error al probar estado AFIP:", error);
    res.status(500).json({ ok: false, message: error.message || "Error al verificar conexión AFIP" });
  }
});

export default router;


