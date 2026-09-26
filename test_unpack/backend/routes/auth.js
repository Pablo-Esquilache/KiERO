import express from "express";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: { error: "Demasiados intentos. Probá en 15 minutos." }
});

import { login, logout } from "../controllers/authController.js";

const router = express.Router();

// ================= LOGIN =================
router.post("/login", loginLimiter, login);

// ================= LOGOUT =================
router.post("/logout", logout);

export default router;
