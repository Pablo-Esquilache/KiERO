import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import pool from "./db.js";

import cajasRoutes from "./routes/cajas.js";
import ventasRouter from "./routes/ventas.js";
import productosRouter from "./routes/productos.js";
import clientesRouter from "./routes/clientes.js";
import gastosRouter from "./routes/gastos.js";
import comerciosRouter from "./routes/comercios.js";
import authRouter from "./routes/auth.js";
import usuariosRouter from "./routes/usuarios.js";
import reportesRoutes from "./routes/reportes.js";
import exportarTablaRouter from "./routes/deacragaExcel.js";

import clientesHistorialRoutes from "./routes/historial.js";
import devolucionesRoutes from "./routes/devoluciones.js";
import syncConfigRoutes from "./routes/syncConfigRoutes.js";
import backupRoutes from "./routes/backupRoutes.js";
import ajustesRoutes from "./routes/ajustes.js";
import turnosRoutes from "./routes/turnos.js";
import { authenticate } from "./middleware/auth.js";

dotenv.config();

const app = express();

/* ===== DB INICIALIZADA ===== */

/* ===== MIDDLEWARES ===== */
app.use(helmet());
app.use(cors({ origin: ['null'] }));
app.use(express.json());

/* ===== RUTAS API ===== */
// En Netlify, la URL base de la función suele ser /.netlify/functions/api
// Pero por comodidad, a veces se usa el enrutador normal y Netlify hace el rewrite
// Rutas PUBLICAS (Login/Logout)
app.use("/api/auth", authRouter);

// Rutas PRIVADAS (Requieren Token)
const router = express.Router();
router.use(authenticate);

router.use("/usuarios", usuariosRouter);
router.use("/ventas", ventasRouter);
router.use("/productos", productosRouter);
router.use("/clientes", clientesRouter);
router.use("/gastos", gastosRouter);
router.use("/comercios", comerciosRouter);
router.use("/exportar-tabla", exportarTablaRouter);

router.use("/reportes", reportesRoutes);
router.use("/", clientesHistorialRoutes);
router.use("/devoluciones", devolucionesRoutes);
router.use("/cajas", cajasRoutes);
router.use("/config-sync", syncConfigRoutes);
router.use("/backup", backupRoutes);
router.use("/ajustes", ajustesRoutes);
router.use("/turnos", turnosRoutes);

// Acoplamos las rutas privadas a /api
app.use("/api", router);

// Exportamos la app pura de Express (sin app.listen) para serverless-http
export default app;



