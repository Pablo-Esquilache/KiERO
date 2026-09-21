const fs = require('fs');

let js = fs.readFileSync('frontend/js/system.js', 'utf8');

if (!js.includes('CajasAPI')) {
    js = js.replace('import { SystemAPI } from "./api.js";', 'import { SystemAPI, CajasAPI } from "./api.js";');
}

const blockCode = `
// ==========================================
// VALIDACIÓN GLOBAL: CAJA ABIERTA PARA VENTAS
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const session = JSON.parse(localStorage.getItem("session"));
  const comercioId = session?.comercio_id;
  
  if (comercioId) {
    const navLinks = document.querySelectorAll(".app-navbar-menu a");
    let ventasLink = null;
    navLinks.forEach(link => {
      if (link.getAttribute("href") === "ventas.html") {
        ventasLink = link;
      }
    });

    if (ventasLink) {
      try {
        const cajaActual = await CajasAPI.getHoy(comercioId);
        if (!cajaActual || cajaActual.estado !== "abierta") {
          // Bloquear visualmente en el menú global
          ventasLink.style.backgroundColor = "#444";
          ventasLink.style.color = "#888";
          ventasLink.innerHTML = "Ventas 🔒";
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
});
`;

if (!js.includes('VALIDACIÓN GLOBAL')) {
    js += '\n' + blockCode;
    fs.writeFileSync('frontend/js/system.js', js);
    console.log("system.js updated");
} else {
    console.log("Already updated");
}
