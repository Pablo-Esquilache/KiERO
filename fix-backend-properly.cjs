const fs = require('fs');
let ctrl = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

const targetStr = `    } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "La caja ya está abierta hoy" });
    }
    console.error("Error abriendo caja:", err);
    res.status(500).json({ error: "Error abriendo caja" });
  }`;

// Actually let's use a regex that handles whitespace exactly
const targetRegex = /\} catch \(err\) \{[\s\S]*?if \(err\.code === "23505"\) \{[\s\S]*?return res\.status\(400\)\.json\([^)]+\);[\s\S]*?\}[\s\S]*?console\.error[^;]+;[\s\S]*?res\.status\(500\)[^;]+;[\s\S]*?\}/;

const newBlock = `} catch (err) {
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
  }`;

if (ctrl.match(targetRegex)) {
    ctrl = ctrl.replace(targetRegex, newBlock);
    fs.writeFileSync('backend/controllers/cajasController.js', ctrl);
    console.log('Fixed backend properly');
} else {
    console.log('Backend regex did not match');
}
