const fs = require('fs');

let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const oldFilaClick = /fila\.addEventListener\("click", \(\) => \{[\s\S]*?modalProductos\.style\.display = "none";\s*\}\);/g;
const newFilaClick = `fila.addEventListener("click", () => {
          const tId = document.getElementById(window.targetProductInput || 'productoVenta');
          const tName = document.getElementById(window.targetProductNameInput || 'productoVentaNombre');
          
          if(tId) tId.value = p.id;
          if(tName) tName.value = p.nombre;
          
          // Focus the quantity input based on which module we are in
          const isDev = window.targetProductInput === 'productoDevolucion';
          const qtyInput = document.getElementById(isDev ? "cantidadDevolucion" : "cantidadVenta");
          if (qtyInput) qtyInput.focus();
          
          modalProductos.style.display = "none";
      });`;

js = js.replace(oldFilaClick, newFilaClick);

// Fix the ID for the modal in the lupita logic
js = js.replace('const m = document.getElementById("modalProductosVenta"); // might be named different', 'const m = document.getElementById("modalProductos");');

fs.writeFileSync('frontend/js/ventas.js', js);
console.log('Fixed product row click');
