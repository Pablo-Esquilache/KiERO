import express from "express";
import {
  getClientes,
  createCliente,
  updateCliente,
  consultarPadronCliente,
  getLocalidades,
  getSaldoCliente,
  getCuentaCorriente,
  registrarPagoCliente,
} from "../controllers/clientesController.js";

const router = express.Router();

// Rutas sin parámetros dinámicos de ID primero (para evitar colisiones de rutas)
router.get("/localidades/lista", getLocalidades);
router.get("/consulta-padron/:cuit", consultarPadronCliente);

router.get("/", getClientes);
router.post("/", createCliente);
router.put("/:id", updateCliente);
router.get("/:id/saldo", getSaldoCliente);
router.get("/:id/cuenta-corriente", getCuentaCorriente);
router.post("/:id/pago", registrarPagoCliente);

export default router;
