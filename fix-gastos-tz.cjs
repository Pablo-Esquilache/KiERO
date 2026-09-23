const fs = require('fs');

let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

// Replace formatFecha
js = js.replace(/function formatFecha\(fechaISO\) \{[\s\S]*?\}/, `function formatFecha(fechaISO) {
  if (!fechaISO) return "-";
  // The backend returns something like "2026-09-23T00:00:00.000Z" for a DATE column.
  // Extract just the YYYY-MM-DD part to avoid local timezone shifts (-3 hrs in Argentina).
  const soloFecha = fechaISO.substring(0, 10);
  const [y, m, d] = soloFecha.split("-");
  return \`\${d}/\${m}/\${y}\`;
}`);

// Replace formatFechaInput
js = js.replace(/function formatFechaInput\(fechaString\) \{[\s\S]*?\}/, `function formatFechaInput(fechaString) {
  if (!fechaString) return "";
  return fechaString.substring(0, 10);
}`);

fs.writeFileSync('frontend/js/gastos.js', js);
console.log('Fixed timezone issues in gastos.js');
