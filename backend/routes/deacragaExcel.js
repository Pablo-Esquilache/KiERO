import { requireAdmin } from "../middleware/auth.js";
import express from "express";
import { exportarExcel, exportarBackupSQL } from "../controllers/exportarController.js";

const router = express.Router();

/* ==========================
   GET - EXPORTAR TABLA A EXCEL
   ========================== */
router.get("/", requireAdmin, exportarExcel);

router.get("/sql", requireAdmin, exportarBackupSQL);

export default router;
