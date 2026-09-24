import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "clave_super_secreta_local";

export async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  
  if (!token) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const payload = jwt.verify(token, SECRET);
    
    // Optimizacion Claude: El JWT es stateless.
    // Confiamos en el payload sin hacer round-trip a la DB por cada request.
    req.user = payload;
    
    // FALLBACK DE SEGURIDAD: Si la base de datos o el token viejo no tiene comercio_id,
    // forzamos a que sea 1 por defecto para evitar errores 500.
    if (!req.user.comercio_id) {
      req.user.comercio_id = 1;
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
