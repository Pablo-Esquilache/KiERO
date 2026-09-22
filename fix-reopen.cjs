const fs = require('fs');

// 1. Modificamos caja.js para permitir reabrir
let js = fs.readFileSync('frontend/js/caja.js', 'utf8');

const targetCerrada = `    } else if (cajaActual.estado === "cerrada") {
      estadoCajaSpan.textContent = "Cerrada";
      bloqueApertura.style.display = "none";
      bloqueResumen.style.display = "none";
    }`;

const newCerrada = `    } else if (cajaActual.estado === "cerrada") {
      estadoCajaSpan.textContent = "Cerrada (Podés reabrirla)";
      bloqueApertura.style.display = "flex";
      bloqueResumen.style.display = "none";
      btnAbrirCaja.textContent = "Reabrir Caja";
    }`;

js = js.replace(targetCerrada, newCerrada);
fs.writeFileSync('frontend/js/caja.js', js);
console.log('caja.js actualizado');


// 2. Modificamos cajasController.js para hacer el UPDATE en caso de error 23505
let ctrl = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

const targetCatch = `    } catch (err) {
      if (err.code === "23505") {
        return res.status(400).json({ error: "La caja ya estǭ abierta hoy" });
      }
      console.error("Error abriendo caja:", err);
      res.status(500).json({ error: "Error abriendo caja" });
    }`;

const newCatch = `    } catch (err) {
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

ctrl = ctrl.replace(/ {4}\} catch \(err\) \{[\s\S]*?Error abriendo caja" \}\);\n    \}/, newCatch);

fs.writeFileSync('backend/controllers/cajasController.js', ctrl);
console.log('cajasController.js actualizado');

