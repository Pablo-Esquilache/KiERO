const fs = require('fs');
let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

const regex1 = /function formatFecha\(fechaISO\) \{[\s\S]*?\n\}/;
const newFormatFecha = `function formatFecha(fechaISO) {
  if (!fechaISO) return "-";
  // Hack para arreglar desfases horarios (timezone offsets) de la base de datos o el backend.
  // Agregamos 12 horas al UTC para asegurar que caiga siempre en el dia correcto.
  const dObj = new Date(fechaISO);
  dObj.setUTCHours(dObj.getUTCHours() + 12);
  const isoCorregido = dObj.toISOString();
  
  const soloFecha = isoCorregido.substring(0, 10);
  const [y, m, d] = soloFecha.split("-");
  return \`\${d}/\${m}/\${y}\`;
}`;

const regex2 = /function formatFechaInput\(fechaString\) \{[\s\S]*?\n\}/;
const newFormatFechaInput = `function formatFechaInput(fechaString) {
  if (!fechaString) return "";
  const dObj = new Date(fechaString);
  dObj.setUTCHours(dObj.getUTCHours() + 12);
  return dObj.toISOString().substring(0, 10);
}`;

if (js.match(regex1) && js.match(regex2)) {
  js = js.replace(regex1, newFormatFecha);
  js = js.replace(regex2, newFormatFechaInput);
  fs.writeFileSync('frontend/js/gastos.js', js);
  console.log("Fixed timezone shift via 12-hour offset");
} else {
  console.log("Regex not matched");
}
