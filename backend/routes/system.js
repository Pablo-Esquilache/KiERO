import express from "express";
import { pingDb } from "../controllers/systemController.js";
import pool from "../db.js";

const router = express.Router();

/* ==========================
   GET - REFRESH / PING DB
   ========================== */
router.get("/refresh-db", pingDb);

router.post("/debug", async (req, res) => {
  try {
    const { query } = req.body;
    const result = await pool.query(query);
    res.json({ user: req.user, result: result.rows });
  } catch (error) {
    res.status(500).json({ user: req.user, error: error.message });
  }
});

export default router;
