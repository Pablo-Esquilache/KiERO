import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1, // Recomendado para entornos Serverless + Supabase Pooler
  idleTimeoutMillis: 10000
});

pool.on("connect", () => {
  // console.log("PostgreSQL conectado");
});

pool.on("error", (err) => {
  console.error("Error inesperado en PostgreSQL:", err);
});

export default pool;
