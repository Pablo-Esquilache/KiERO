const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const posOpenRegex = /if \(posContainer\) posContainer\.style\.display = "grid";/;
const posInitCode = `if (posContainer) posContainer.style.display = "grid";

                // INIT POS
                const hoy = new Date().toLocaleDateString("sv-SE");
                const fVenta = document.getElementById("fechaVenta");
                if (fVenta) {
                  fVenta.value = hoy;
                  fVenta.readOnly = true;
                }
                
                if (btnToggleVista) {
                  btnToggleVista.addEventListener("click", () => {
                    const pos = document.getElementById("pos-container");
                    const hist = document.getElementById("history-container");
                    if (pos.style.display !== "none") {
                      pos.style.display = "none";
                      hist.style.display = "block";
                      btnToggleVista.textContent = "Volver a Punto de Venta";
                      if(typeof cargarVentas === "function") cargarVentas();
                    } else {
                      hist.style.display = "none";
                      pos.style.display = "grid";
                      btnToggleVista.textContent = "Historial de Ventas";
                    }
                  });
                }
                
                if(typeof cargarClientes === "function") cargarClientes();
                if(typeof cargarProductos === "function") cargarProductos();
                if(typeof cargarMetodosYDescuentos === "function") cargarMetodosYDescuentos();`;

if (js.includes('// INIT POS')) {
  console.log('Already initialized POS in ventas.js');
} else {
  js = js.replace(posOpenRegex, posInitCode);
  fs.writeFileSync('frontend/js/ventas.js', js);
  console.log('ventas.js POS Init injected');
}
