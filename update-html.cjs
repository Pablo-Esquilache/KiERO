const fs = require('fs');

let html = fs.readFileSync('frontend/pages/caja.html', 'utf8');

const replacement = `<div class="dashboard-cards">
            <div class="card-caja card-inicial">
              <h4>Saldo Inicial</h4>
              <p>$<span id="saldoInicialCard">0.00</span></p>
            </div>
            
            <div class="card-caja card-efectivo">
              <h4>Efectivo</h4>
              <p>$<span id="totalEfectivo">0.00</span></p>
            </div>
            
            <div class="card-caja card-digital">
              <h4>Digitales</h4>
              <p>$<span id="totalDigital">0.00</span></p>
            </div>

            <div class="card-caja card-cc">
              <h4>Cta. Corriente</h4>
              <p>$<span id="totalCuentaCorriente">0.00</span></p>
            </div>

            <div class="card-caja card-egresos">
              <h4>Egresos</h4>
              <p>$<span id="totalEgresos">0.00</span></p>
            </div>

            <div class="card-caja card-resultado">
              <h4>Total</h4>
              <p>$<span id="resultadoFinal">0.00</span></p>
            </div>
          </div>`;

const start = html.indexOf('<div class="dashboard-cards">');
const end = html.indexOf('<!-- ============================', start);

if (start > -1 && end > start) {
    html = html.substring(0, start) + replacement + "\n\n          " + html.substring(end);
    fs.writeFileSync('frontend/pages/caja.html', html);
    console.log("HTML updated");
} else {
    console.log("Could not find boundaries");
}
