import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET;

export async function authenticate(req, res, next) {
  if (!SECRET) {
    return res.status(500).json({ error: "Falta configurar JWT_SECRET en las variables de entorno del servidor" });
  }

  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    req.user = payload;
    
    if (!req.user.comercio_id) {
      return res.status(400).json({ error: "El usuario no tiene un comercio asignado" });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invlido o expirado" });
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Acceso denegado. Se requiere rol de administrador." });
  }
  next();
}
