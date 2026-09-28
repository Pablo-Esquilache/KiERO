import pool from "./backend/db.js";
pool.query("SELECT CURRENT_DATE").then(res => console.log(res.rows));
