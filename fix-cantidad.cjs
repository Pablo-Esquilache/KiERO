const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const regex = /<input type="number" id="cantidadVenta" min="1" class="app-input" placeholder="Cant\." style="flex: 0\.5; max-width: 80px; text-align: center;" \/>/;
const newHtml = `<input type="number" id="cantidadVenta" min="1" value="1" class="app-input" placeholder="Cant." style="flex: 0.5; max-width: 80px; text-align: center;" />`;

if (html.match(regex)) {
  html = html.replace(regex, newHtml);
  fs.writeFileSync('frontend/pages/ventas.html', html);
  console.log("Replaced input successfully");
} else {
  console.log("Could not match the exact input string");
}
