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
    
    // Optimizacin Claude: El JWT es stateless.
    // Confiamos en el payload sin hacer round-trip a la DB por cada request.
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invǭlido o expirado" });
  }
}
