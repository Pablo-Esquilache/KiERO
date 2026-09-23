const fs = require('fs');
let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

js = js.replace(/function formatFecha\(fechaISO\) \{[\s\S]*?\}\/\$\{m\}\/\$\{y\}`;/, `function formatFecha(fechaISO) {
  if (!fechaISO) return "-";
  const soloFecha = fechaISO.substring(0, 10);
  const [y, m, d] = soloFecha.split("-");
  return \`\${d}/\${m}/\${y}\`;`);

js = js.replace(/function formatFechaInput\(fechaString\) \{[\s\S]*?\}-\$\{mm\}-\$\{dd\}`;/, `function formatFechaInput(fechaString) {
  if (!fechaString) return "";
  return fechaString.substring(0, 10);`);

fs.writeFileSync('frontend/js/gastos.js', js);
console.log('Fixed syntax issues.');
