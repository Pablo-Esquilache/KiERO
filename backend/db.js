import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pkg;

const isLocal = process.env.DATABASE_URL && process.env.DATABASE_URL.includes("127.0.0.1");

const poolConfig = { 
  connectionString: process.env.DATABASE_URL,
  ...(isLocal ? {} : { ssl: { rejectUnauthorized: false } }),
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
