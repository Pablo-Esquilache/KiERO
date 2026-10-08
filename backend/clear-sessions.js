import pool from "./db.js";

async function clearSessions() {
  try {
    await pool.query("UPDATE usuarios SET active_session = NULL");
    console.log("Sesiones limpiadas correctamente.");
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

clearSessions();
