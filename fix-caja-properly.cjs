const fs = require('fs');
let js = fs.readFileSync('frontend/js/caja.js', 'utf8');

const targetCerradaRegex = /\} else if \(cajaActual\.estado === "cerrada"\) \{[\s\S]*?\}/;

const newCerrada = `} else if (cajaActual.estado === "cerrada") {
    estadoCajaSpan.textContent = "Cerrada (Podés reabrirla)";
    bloqueApertura.style.display = "flex";
    bloqueResumen.style.display = "none";
    btnAbrirCaja.textContent = "Reabrir Caja";
  }`;

if (js.match(targetCerradaRegex)) {
    js = js.replace(targetCerradaRegex, newCerrada);
    fs.writeFileSync('frontend/js/caja.js', js);
    console.log('Fixed caja.js properly');
} else {
    console.log('Regex did not match');
}
