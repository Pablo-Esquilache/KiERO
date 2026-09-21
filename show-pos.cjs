const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const targetStr = `            const cajaActual = await CajasAPI.getHoy(comercioId);
            if (!cajaActual || cajaActual.estado !== "abierta") {
                const posHeader = document.querySelector(".pos-header");
                const posContainer = document.getElementById("pos-container");
                const historyContainer = document.getElementById("history-container");
                const btnToggleVista = document.getElementById("btnToggleVista");
                
                if (posHeader) posHeader.style.display = "none";
                if (posContainer) posContainer.style.display = "none";
                if (historyContainer) historyContainer.style.display = "none";
                if (btnToggleVista) btnToggleVista.style.display = "none";
                
                const overlay = document.createElement("div");
                overlay.innerHTML = \`
                  <div style="text-align: center; padding: 100px 20px; background: rgba(0,0,0,0.05); border-radius: 12px; margin-top: 20px; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #e63946; font-size: 2em; margin-bottom: 20px;">⚠️ Atención: La caja está cerrada</h2>
                    <p style="font-size: 1.2em; color: #555; margin-bottom: 30px;">Debes abrir la caja del día para poder realizar ventas en el mostrador.</p>
                    <a href="caja.html" class="app-btn-primary" style="padding: 15px 30px; font-size: 1.2em; text-decoration: none; display: inline-block; border-radius: 8px;">Ir a Abrir Caja</a>
                  </div>
                \`;
                
                const mainContainer = document.querySelector(".app-container");
                if (mainContainer) {
                    mainContainer.appendChild(overlay);
                }
                
                // Also grey out the active nav item
                const navItem = document.querySelector(".app-navbar-menu a.app-active");
                if (navItem) {
                    navItem.style.backgroundColor = "#555";
                    navItem.style.color = "#ccc";
                    navItem.innerHTML = "Ventas 🔒";
                }
            }`;

const newStr = `            const cajaActual = await CajasAPI.getHoy(comercioId);
            const posHeader = document.querySelector(".pos-header");
            const posContainer = document.getElementById("pos-container");
            const historyContainer = document.getElementById("history-container");
            const btnToggleVista = document.getElementById("btnToggleVista");
            
            if (!cajaActual || cajaActual.estado !== "abierta") {
                if (posHeader) posHeader.style.display = "none";
                if (posContainer) posContainer.style.display = "none";
                if (historyContainer) historyContainer.style.display = "none";
                if (btnToggleVista) btnToggleVista.style.display = "none";
                
                const overlay = document.createElement("div");
                overlay.innerHTML = \`
                  <div style="text-align: center; padding: 100px 20px; background: rgba(0,0,0,0.05); border-radius: 12px; margin-top: 20px; max-width: 600px; margin-left: auto; margin-right: auto; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                    <h2 style="color: #e63946; font-size: 2em; margin-bottom: 20px;">⚠️ Atención: La caja está cerrada</h2>
                    <p style="font-size: 1.2em; color: #555; margin-bottom: 30px;">Debes abrir la caja del día para poder realizar ventas en el mostrador.</p>
                    <a href="caja.html" class="app-btn-primary" style="padding: 15px 30px; font-size: 1.2em; text-decoration: none; display: inline-block; border-radius: 8px;">Ir a Abrir Caja</a>
                  </div>
                \`;
                
                const mainContainer = document.querySelector(".app-container");
                if (mainContainer) {
                    mainContainer.appendChild(overlay);
                }
                
                // Also grey out the active nav item
                const navItem = document.querySelector(".app-navbar-menu a.app-active");
                if (navItem) {
                    navItem.style.backgroundColor = "#555";
                    navItem.style.color = "#ccc";
                    navItem.innerHTML = "Ventas 🔒";
                }
            } else {
                // Caja abierta: mostramos la interfaz que estaba oculta por defecto en HTML
                if (posHeader) posHeader.style.display = "block";
                if (posContainer) posContainer.style.display = "grid";
            }`;

if (js.includes('if (!cajaActual || cajaActual.estado !== "abierta") {')) {
    js = js.replace(targetStr, newStr);
    fs.writeFileSync('frontend/js/ventas.js', js);
    console.log("ventas.js updated");
} else {
    console.log("Not found");
}
