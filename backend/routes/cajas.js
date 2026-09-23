import express from "express";
import {
  getCajaHoy,
  abrirCaja,
  cerrarCaja,
  getMovimientosDia,
  getHistorial,
} from "../controllers/cajasController.js";
import pool from "../db.js";

const router = express.Router();

// ENDPOINT TEMPORAL PARA BORRAR LA RESTRICCION EN SUPABASE
router.get("/fix-db", async (req, res) => {
  try {
    const query = `
      SELECT conname 
      FROM pg_constraint 
      WHERE conrelid = 'cajas'::regclass 
      AND contype = 'u';
    `;
    const result = await pool.query(query);
    for (let row of result.rows) {
      await pool.query(`ALTER TABLE cajas DROP CONSTRAINT IF EXISTS "${row.conname}"`);
    }
    res.send("Restriccion borrada con exito en Supabase. Ya podes abrir multiples cajas hoy. Podes cerrar esta ventana.");
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
});

router.get("/hoy/:comercioId", getCajaHoy);
router.post("/abrir", abrirCaja);
router.put("/cerrar/:id", cerrarCaja);
router.get("/movimientos/:comercioId", getMovimientosDia);
router.get("/historial/:comercioId", getHistorial);

export default router;
