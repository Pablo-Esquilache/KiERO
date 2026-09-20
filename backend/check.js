import pool from './db.js';

pool.query('SELECT * FROM metodos_pago').then(res => { 
  console.log("metodos:", res.rows); 
  return pool.query('SELECT * FROM descuentos'); 
}).then(res => { 
  console.log("descuentos:", res.rows); 
  process.exit(0); 
}).catch(err => {
  console.error(err);
  process.exit(1);
});
