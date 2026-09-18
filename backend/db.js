import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST || "localhost",
  database: process.env.PGDATABASE || "postgres",
  user: process.env.PGUSER || "app_ventas",
  password: process.env.PGPASSWORD || "123456",
  port: process.env.PGPORT || 5432,
  ssl: process.env.PGHOST && process.env.PGHOST !== "localhost" && process.env.PGHOST !== "127.0.0.1" 
    ? { rejectUnauthorized: false } 
    : false,
});


pool.on("connect", () => {
  console.log("🔌 PostgreSQL conectado");
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en PostgreSQL:", err);
});

export default pool;
