import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import {
  getVentas,
  getVentaById,
  getVentaDetalle,
  createVenta,
  updateVenta,
  deleteVenta,
  conciliarVentaFiscal,
  resolverManualFiscal,
} from "../controllers/ventasController.js";

const router = express.Router();

router.get("/", getVentas);
router.get("/:id", getVentaById);
router.get("/:id/detalle", getVentaDetalle);
router.post("/", createVenta);
router.put("/:id", updateVenta);
router.delete("/:id", deleteVenta);
router.post("/:id/conciliar-fiscal", requireAdmin, conciliarVentaFiscal);
router.post("/:id/resolver-manual-fiscal", requireAdmin, resolverManualFiscal);

export default router;
