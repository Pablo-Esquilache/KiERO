import express from "express";
import { exportarExcel, exportarBackupSQL } from "../controllers/exportarController.js";

const router = express.Router();

/* ==========================
   GET - EXPORTAR TABLA A EXCEL
   ========================== */
router.get("/", exportarExcel);

router.get("/sql", exportarBackupSQL);

export default router;
