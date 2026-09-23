const fs = require('fs');

let js = fs.readFileSync('backend/controllers/cajasController.js', 'utf8');

const regexGastos = /const gastos = await pool\.query\([\s\S]*?`SELECT id, fecha, importe, descripcion\s*FROM gastos\s*WHERE comercio_id = \$1\s*\$\{timeCondition\}`,\s*baseParams\s*\);/;

const newGastosQuery = `
      // Modificamos la condicion para gastos: 
      // Si la caja esta abierta (no hay endTime), solo incluimos los gastos hasta el final del dia en que se abrio la caja.
      // Asi evitamos que un gasto del dia 28 se sume a la caja de hoy.
      const gastosTimeCondition = endTime 
        ? \`AND fecha >= $2 AND fecha <= $3\` 
        : \`AND fecha >= $2 AND fecha::date <= $2::date\`;

      const gastos = await pool.query(
        \`SELECT id, fecha, importe, descripcion
         FROM gastos
         WHERE comercio_id = $1
         \${gastosTimeCondition}\`,
        baseParams
      );
`;

if (js.match(regexGastos)) {
  js = js.replace(regexGastos, newGastosQuery);
  fs.writeFileSync('backend/controllers/cajasController.js', js);
  console.log('Fixed future expenses in active caja');
} else {
  console.log('Regex failed');
}
