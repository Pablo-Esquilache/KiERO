const fs = require('fs');

let js = fs.readFileSync('frontend/js/caja.js', 'utf8');

const targetStr = `  // Usamos los totales del backend para las tarjetas
  const totalEgresosSumados = t.egresos + t.devoluciones;
  
  // Resultado Físico Final (Saldo Inicial + Efectivo + Digitales - Egresos/Devoluciones (no Cta.Cte))
  // Ojo, si hubo devoluciones en Cta Cte, el backend las suma todas. 
  // Pero el resultado final físico siempre es igual al saldo acumulado final.
  const resultadoFisico = saldo;

  document.getElementById("totalEfectivo").textContent = t.efectivo.toFixed(2);
  document.getElementById("totalDigital").textContent = t.digital.toFixed(2);
  document.getElementById("totalCuentaCorriente").textContent = t.cuenta_corriente.toFixed(2);
  document.getElementById("totalEgresos").textContent = totalEgresosSumados.toFixed(2);
  
  window.tempDevoluciones = t.devoluciones;
  window.tempGastos = t.egresos;
  
  document.getElementById("resultadoFinal").textContent = resultadoFisico.toFixed(2);`;

const replacementStr = `  // Usamos los totales del backend para las tarjetas
  const totalEgresosSumados = t.egresos + t.devoluciones;
  
  const saldoInicialVal = Number(cajaActual?.saldo_inicial) || 0;
  
  // Total = Efectivo + Digitales + Cta. Corriente - Egresos (No incluye saldo inicial por pedido del usuario)
  const granTotal = t.efectivo + t.digital + t.cuenta_corriente - totalEgresosSumados;

  document.getElementById("saldoInicialCard").textContent = saldoInicialVal.toFixed(2);
  document.getElementById("totalEfectivo").textContent = t.efectivo.toFixed(2);
  document.getElementById("totalDigital").textContent = t.digital.toFixed(2);
  document.getElementById("totalCuentaCorriente").textContent = t.cuenta_corriente.toFixed(2);
  document.getElementById("totalEgresos").textContent = totalEgresosSumados.toFixed(2);
  
  window.tempDevoluciones = t.devoluciones;
  window.tempGastos = t.egresos;
  
  document.getElementById("resultadoFinal").textContent = granTotal.toFixed(2);`;

if (js.includes('const totalEgresosSumados = t.egresos + t.devoluciones;')) {
    // Just find the block manually
    const start = js.indexOf('  // Usamos los totales del backend para las tarjetas');
    const end = js.indexOf('}', start);
    
    if (start > -1 && end > start) {
        js = js.substring(0, start) + replacementStr + "\n" + js.substring(end);
        fs.writeFileSync('frontend/js/caja.js', js);
        console.log("JS updated");
    } else {
        console.log("Could not find js boundaries");
    }
} else {
    console.log("Could not find target str");
}
