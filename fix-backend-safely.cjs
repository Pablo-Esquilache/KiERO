const fs = require('fs');
let ctrl = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

const oldAbrir = `export const abrirCaja = async (req, res) => {
  const { comercio_id, saldo_inicial, fecha } = req.body;

  try {
    const { rows } = await pool.query(
      \`INSERT INTO cajas (comercio_id, fecha, saldo_inicial)
       VALUES ($1, COALESCE($3, CURRENT_DATE), $2)
       RETURNING *\`,
      [comercio_id, saldo_inicial, (fecha && fecha.length === 10) ? fecha + "T12:00:00Z" : null],
    );

    res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "La caja ya está abierta hoy" });
    }
    console.error("Error abriendo caja:", err);
    res.status(500).json({ error: "Error abriendo caja" });
  }
};`;

const newAbrir = `export const abrirCaja = async (req, res) => {
  const { comercio_id, saldo_inicial, fecha } = req.body;

  try {
    const { rows } = await pool.query(
      \`INSERT INTO cajas (comercio_id, fecha, saldo_inicial)
       VALUES ($1, COALESCE($3, CURRENT_DATE), $2)
       RETURNING *\`,
      [comercio_id, saldo_inicial, (fecha && fecha.length === 10) ? fecha + "T12:00:00Z" : null],
    );

    res.json(rows[0]);
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
};`;

// Use simple indexOf to make absolutely sure
const startIdx = ctrl.indexOf('export const abrirCaja');
const endIdx = ctrl.indexOf('};', startIdx) + 2;

if (startIdx > -1) {
    ctrl = ctrl.substring(0, startIdx) + newAbrir + ctrl.substring(endIdx);
    fs.writeFileSync('backend/controllers/cajasController.js', ctrl);
    console.log('Fixed backend safely');
} else {
    console.log('Not found');
}
