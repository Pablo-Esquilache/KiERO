import express from "express";
import pool from "../db.js";
import bcrypt from "bcryptjs";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET all users by comercioId (Solamente el propio comercio_id)
router.get("/", requireAdmin, async (req, res) => {
  const comercioId = req.user.comercio_id;
  try {
    const result = await pool.query(
      "SELECT id, usuario, role, comercio_id, created_at, last_login FROM usuarios WHERE comercio_id = $1 ORDER BY id ASC",
      [comercioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// GET compatible con params anterior (por si el frontend lo manda)
router.get("/:comercioId", requireAdmin, async (req, res) => {
  const comercioId = req.user.comercio_id; // Forzado
  try {
    const result = await pool.query(
      "SELECT id, usuario, role, comercio_id, created_at, last_login FROM usuarios WHERE comercio_id = $1 ORDER BY id ASC",
      [comercioId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// POST create new user
router.post("/", requireAdmin, async (req, res) => {
  const { usuario, password, role = "user" } = req.body;
  const comercio_id = req.user.comercio_id; // Forzado
  
  if (!usuario || !password) {
    return res.status(400).json({ error: "Datos incompletos" });
  }

  try {
    // Check if user exists (globalmente o por comercio)
    const existing = await pool.query("SELECT id FROM usuarios WHERE usuario = $1", [usuario]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO usuarios (usuario, password, role, comercio_id) VALUES ($1, $2, $3, $4) RETURNING id, usuario, role, comercio_id",
      [usuario, hashedPassword, role, comercio_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// PUT update user (password, role, etc)
router.put("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { usuario, password, role } = req.body;
  const comercioId = req.user.comercio_id; // Forzado

  try {
    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (usuario) {
      updates.push(`usuario = $${queryIndex++}`);
      values.push(usuario);
    }
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push(`password = $${queryIndex++}`);
      values.push(hashedPassword);
      // Force logout on password change
      updates.push(`active_session = NULL`);
    }

    if (role) {
      updates.push(`role = $${queryIndex++}`);
      values.push(role);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    values.push(id);
    values.push(comercioId);
    
    // Validamos ID y Comercio
    const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = $${queryIndex} AND comercio_id = $${queryIndex + 1} RETURNING id, usuario, role`;
    
    const result = await pool.query(query, values);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado o no pertenece a tu comercio" });
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// DELETE user
router.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const comercioId = req.user.comercio_id; // Forzado
  
  try {
    const result = await pool.query("DELETE FROM usuarios WHERE id = $1 AND comercio_id = $2 RETURNING id", [id, comercioId]);
    if (result.rows.length === 0) return res.status(404).json({ error: "Usuario no encontrado o no pertenece a tu comercio" });
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

export default router;
