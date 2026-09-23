import jwt from "jsonwebtoken";
import pool from "../db.js";

const SECRET = process.env.JWT_SECRET || "clave_super_secreta_local";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    
    // Verificamos que la sesión siga activa y exista el usuario
    const { rows } = await pool.query(
      "SELECT id, role, comercio_id, active_session FROM usuarios WHERE id = $1",
      [payload.id]
    );
    const user = rows[0];
    
    if (!user || !user.active_session) {
      return res.status(401).json({ error: "Sesión expirada o inválida, iniciá sesión de nuevo" });
    }
    
    // Inyectamos el usuario validado y su comercio_id en la request
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}
