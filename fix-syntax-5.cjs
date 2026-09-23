const fs = require('fs');
let js = fs.readFileSync('frontend/js/gastos.js', 'utf8');

js = js.replace(/function formatFecha\(fechaISO\) \{[\s\S]*?\n\}/, `function formatFecha(fechaISO) {
  if (!fechaISO) return "-";
  const soloFecha = fechaISO.substring(0, 10);
  const [y, m, d] = soloFecha.split("-");
  return \`\${d}/\${m}/\${y}\`;
}`);

fs.writeFileSync('frontend/js/gastos.js', js);
console.log('Fixed formatFecha correctly');
