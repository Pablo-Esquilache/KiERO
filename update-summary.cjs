const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

const targetSummary = `document.getElementById("resumenHistorial").innerHTML = \`
  <div class="resumen-item">
    <span>Total contado</span>
    <strong>$\${totalContado.toFixed(2)}</strong>
  </div>
  <div class="resumen-item">
    <span>Saldo cuenta corriente</span>
    <strong>$\${saldo.toFixed(2)}</strong>
  </div>
  <div class="resumen-item">
    <span>Total general ventas</span>
    <strong>$\${totalGeneral.toFixed(2)}</strong>
  </div>
\`;`;

const regexSummary = /document\.getElementById\("resumenHistorial"\)\.innerHTML = `[\s\S]*?`;/;

const newSummary = `
      // Highlight debt
      let saldoHtml = '';
      if (saldo > 0) {
        saldoHtml = \`<strong style="color: #e53935; font-size: 18px;">$ \${saldo.toFixed(2)} (DEUDA)</strong>\`;
      } else if (saldo < 0) {
        saldoHtml = \`<strong style="color: #43a047; font-size: 18px;">$ \${Math.abs(saldo).toFixed(2)} (A FAVOR)</strong>\`;
      } else {
        saldoHtml = \`<strong>$ 0.00 (AL DÍA)</strong>\`;
      }

      document.getElementById("resumenHistorial").innerHTML = \`
  <div class="resumen-item" style="border-left: 4px solid #43a047;">
    <span>Pagado al Contado</span>
    <strong>$ \${totalContado.toFixed(2)}</strong>
  </div>
  <div class="resumen-item" style="border-left: 4px solid #2196f3;">
    <span>Total Histórico Comprado</span>
    <strong>$ \${totalGeneral.toFixed(2)}</strong>
  </div>
  <div class="resumen-item" style="background: \${saldo > 0 ? '#ffebee' : (saldo < 0 ? '#e8f5e9' : '#f8fafc')}; border: 1px solid \${saldo > 0 ? '#ffcdd2' : (saldo < 0 ? '#c8e6c9' : '#e2e8f0')};">
    <span>Estado de Cuenta Corriente</span>
    \${saldoHtml}
  </div>
\`;`;

if (js.match(regexSummary)) {
    js = js.replace(regexSummary, newSummary);
    fs.writeFileSync('frontend/js/clientes.js', js);
    console.log('Summary updated');
} else {
    // If it doesn't match perfectly, fallback to string replacement
    const idx = js.indexOf('document.getElementById("resumenHistorial").innerHTML =');
    if (idx > -1) {
        const endIdx = js.indexOf('`;', idx) + 2;
        js = js.substring(0, idx) + newSummary.trim() + js.substring(endIdx);
        fs.writeFileSync('frontend/js/clientes.js', js);
        console.log('Summary updated by index');
    }
}
