const fs = require('fs');
let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

const regex1 = /function formatFecha\(fechaISO\) \{[\s\S]*?\n\}/;
const cleanFormatFecha = `function formatFecha(fechaISO) {
  if (!fechaISO) return "-";
  const soloFecha = fechaISO.substring(0, 10);
  const [y, m, d] = soloFecha.split("-");
  return \`\${d}/\${m}/\${y}\`;
}`;

const regex2 = /function formatFechaInput\(fechaString\) \{[\s\S]*?\n\}/;
const cleanFormatFechaInput = `function formatFechaInput(fechaString) {
  if (!fechaString) return "";
  return fechaString.substring(0, 10);
}`;

if (js.match(regex1) && js.match(regex2)) {
  js = js.replace(regex1, cleanFormatFecha);
  js = js.replace(regex2, cleanFormatFechaInput);
  fs.writeFileSync('frontend/js/gastos.js', js);
  console.log("Reverted to clean substring approach");
} else {
  console.log("Regex not matched");
}
