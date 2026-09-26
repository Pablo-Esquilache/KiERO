const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

html = html.replace(/<input type="number" class="app-input" value="1" min="1" id="cantidadVenta" style="width: 70px;" \/>/,
  `<input type="number" class="app-input" value="1" min="1" id="cantidadVenta" style="width: 70px;" />\n              <input type="number" id="precioCustomVenta" class="app-input" placeholder="Precio $" step="0.01" min="0.01" style="display:none; width:90px;">`);

html = html.replace(/<input type="number" class="app-input" value="1" min="1" id="cantidadDevolucion" style="width: 70px;" \/>/,
  `<input type="number" class="app-input" value="1" min="1" id="cantidadDevolucion" style="width: 70px;" />\n                <input type="number" id="precioCustomDevolucion" class="app-input" placeholder="Precio $" step="0.01" min="0.01" style="display:none; width:90px;">`);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log("Success html ventas replace");
