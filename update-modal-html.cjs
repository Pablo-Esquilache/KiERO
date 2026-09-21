const fs = require('fs');
let html = fs.readFileSync('frontend/pages/productos.html', 'utf8');

const targetStr = `          <div class="app-form-row">
            <div class="app-form-group">
              <label>Nombre</label>
              <input
                type="text"
                id="nombreProducto"
                class="app-input"
                required
              />
            </div>

            <div class="app-form-group">
              <label>Categoría</label>
              <select id="categoriaProducto" class="app-input">
                <option value="" disabled selected>
                  Seleccionar categoría
                </option>
              </select>
            </div>
            <div
              class="app-form-group"
              style="display: flex; gap: 8px; align-items: center"
            >
              <button
                type="button"
                id="btnNuevaCategoria"
                class="app-btn-secondary"
              >
                Nueva
              </button>
              <input
                type="text"
                id="nuevaCategoriaProducto"
                class="app-input"
                placeholder="Escribí nueva categoría"
                style="display: none; margin-top: 8px"
              />
            </div>
          </div>`;

const newStr = `          <div class="app-form-row">
            <div class="app-form-group">
              <label>Nombre</label>
              <input type="text" id="nombreProducto" class="app-input" required />
            </div>

            <div class="app-form-group">
              <label>Categoría</label>
              <div style="display: flex; gap: 8px; align-items: center;">
                <select id="categoriaProducto" class="app-input" style="flex: 1;">
                  <option value="" disabled selected>Seleccionar categoría</option>
                </select>
                <input type="text" id="nuevaCategoriaProducto" class="app-input" placeholder="Escribí nueva categoría" style="display: none; flex: 1;" />
                <button type="button" id="btnNuevaCategoria" class="app-btn-secondary" style="flex-shrink: 0;">Nueva</button>
              </div>
            </div>
          </div>`;

if (html.includes(targetStr)) {
    html = html.replace(targetStr, newStr);
    html = html.replace('class="app-modal-content-producto"', 'class="app-modal-content"');
    fs.writeFileSync('frontend/pages/productos.html', html);
    console.log('HTML updated');
} else {
    // try replacing with regex
    console.log('HTML not updated');
}
