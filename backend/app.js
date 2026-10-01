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
import systemRoutes from "./routes/system.js";
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

// Al iniciar la app de escritorio, limpiar cualquier sesin activa que haya quedado colgada
// (por ejemplo si el usuario cerr la ventana de golpe sin desloguearse)
pool.query("UPDATE usuarios SET active_session = NULL").catch(err => console.error("Error limpiando sesiones:", err));


dotenv.config();

const app = express();

/* ===== TEST CONEXIÓN DB ===== */
pool.query("SELECT CURRENT_TIMESTAMP")
  .then(res => {
    console.log("✅ Base conectada en la NUBE:", res.rows[0]);
    // Asegurar que exista "Consumidor Final" para todos los comercios
    return pool.query(`
      INSERT INTO clientes (nombre, comercio_id)
      SELECT 'Consumidor Final', id FROM comercios c
      WHERE NOT EXISTS (
        SELECT 1 FROM clientes cl WHERE cl.nombre LIKE '%Consumidor Final%' AND cl.comercio_id = c.id
      )
    `);
  })
  .catch(err => console.error("❌ Error conexión DB:", err));

/* ===== MIDDLEWARES ===== */
app.use(helmet());
app.use(cors({ origin: ["https://kiero-appventas.netlify.app"] }));
app.use(express.json());

/* ===== RUTAS API ===== */
// En Netlify, la URL base de la función suele ser /.netlify/functions/api
// Pero por comodidad, a veces se usa el enrutador normal y Netlify hace el rewrite
// Rutas PUBLICAS (Login/Logout)
app.use("/api/auth", authRouter);
app.use("/api/system", systemRoutes);

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


