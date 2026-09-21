const fs = require('fs');
let js = fs.readFileSync('frontend/js/system.js', 'utf8');

const lines = js.split('\\n');
for (let i=0; i<lines.length; i++) {
    if (lines[i].includes('ventasLink.innerHTML = "Ventas') && lines[i].includes('Bloquear visualmente')) {
         // wait, it's after the comment
    }
}
// Actually, let's just write exactly what we want at the end of the file
const scriptStart = js.indexOf('// VALIDACIÓN GLOBAL');
if (scriptStart > -1) {
    js = js.substring(0, scriptStart) + `// ==========================================
// VALIDACIÓN GLOBAL: CAJA ABIERTA PARA VENTAS
// ==========================================
(async () => {
  const session = JSON.parse(localStorage.getItem("session"));
  const comercioId = session?.comercio_id;
  
  if (comercioId) {
    const ventasLink = document.querySelector("#tab-ventas a");

    if (ventasLink) {
      try {
        const cajaActual = await CajasAPI.getHoy(comercioId);
        if (!cajaActual || cajaActual.estado !== "abierta") {
          // Bloquear visualmente en el menú global
          ventasLink.style.backgroundColor = "#444";
          ventasLink.style.color = "#888";
          ventasLink.innerHTML = "Ventas \\uD83D\\uDD12";
          ventasLink.title = "Debes abrir la caja para acceder a Ventas";
        } else {
          // Si por algún motivo estaba bloqueado y se abre (por ej. recarga manual)
          ventasLink.innerHTML = "Ventas";
          ventasLink.title = "";
          // Removemos estilos inline para que herede del CSS
          ventasLink.style.backgroundColor = "";
          ventasLink.style.color = "";
        }
      } catch (err) {
        console.error("Error global verificando estado de caja:", err);
      }
    }
  }
})();
`;
    fs.writeFileSync('frontend/js/system.js', js);
    console.log('Fixed exactly');
}
