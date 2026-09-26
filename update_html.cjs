const fs = require('fs');
let html = fs.readFileSync('frontend/pages/productos.html', 'utf8');

const regex = /<button type="button" id="btnNuevaCategoria"[^>]*>Nueva<\/button>\s*<\/div>\s*<\/div>/;

const match = html.match(regex);

if (match) {
    const insertion = `\n\n          <div class="app-form-group" id="containerPrecioAbierto" style="display: none; flex-direction: row; align-items: center; gap: 10px;">\n            <input type="checkbox" id="precioAbiertoProducto" style="width: auto;"/>\n            <label for="precioAbiertoProducto" style="margin: 0; color: #b45309; font-weight: bold;">Precio Variable (Comodín)</label>\n          </div>`;
          
    html = html.replace(match[0], match[0] + insertion);
    fs.writeFileSync('frontend/pages/productos.html', html);
    console.log("Success HTML replace");
} else {
    console.log("Anchor not found");
}
