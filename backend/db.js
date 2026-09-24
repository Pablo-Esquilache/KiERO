import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL 
  ? { 
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10, // Límite de conexiones para evitar agotar el pool de Supabase
      idleTimeoutMillis: 10000
    }
  : {
      host: process.env.PGHOST || "localhost",
      database: process.env.PGDATABASE || "postgres",
      user: process.env.PGUSER || "app_ventas",
      password: process.env.PGPASSWORD || "123456",
      port: process.env.PGPORT || 5432,
      ssl: process.env.PGHOST && process.env.PGHOST !== "localhost" && process.env.PGHOST !== "127.0.0.1" 
        ? { rejectUnauthorized: false } 
        : false,
      max: 10,
      idleTimeoutMillis: 10000
    };

const pool = new Pool(poolConfig);

pool.on("connect", () => {
  // console.log("PostgreSQL conectado");
});

pool.on("error", (err) => {
  console.error("Error inesperado en PostgreSQL:", err);
});

export default pool;
