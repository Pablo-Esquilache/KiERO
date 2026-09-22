const fs = require('fs');
let html = fs.readFileSync('frontend/pages/productos.html', 'utf8');

const targetStart = html.indexOf('<div id="modalProducto" class="app-modal">');
const targetEnd = html.indexOf('</form>', targetStart) + 7;

if (targetStart > -1 && targetEnd > targetStart) {
    const newModal = `<div id="modalProducto" class="app-modal">
      <div class="app-modal-content app-modal-sm">
        <div class="app-modal-header">
          <h2 class="app-subtitle" id="tituloModalProducto">Nuevo producto</h2>
          <button type="button" class="app-close">Cerrar</button>
        </div>

        <form id="formProducto" class="app-form-venta">
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

          <div class="app-form-group">
            <label>Código de Barras (Opcional)</label>
            <input
              type="text"
              id="codigoBarrasProducto"
              class="app-input"
              placeholder="Escaneá acá tu código de barras"
            />
          </div>

          <div class="app-form-group">
            <label id="labelStockProducto">Stock inicial</label>
            <input
              type="number"
              id="stockProducto"
              min="0"
              class="app-input"
              required
            />
          </div>

          <div class="app-form-group" id="grupoStockIngresar" style="display: none;">
            <label>Stock a ingresar (+)</label>
            <input
              type="number"
              id="stockIngresarProducto"
              min="0"
              class="app-input"
            />
          </div>

          <div class="app-form-group">
            <label>Precio</label>
            <input
              type="number"
              id="precioProducto"
              min="0"
              step="0.01"
              class="app-input"
              required
            />
          </div>

          <button type="submit" id="btnGuardarProducto" class="app-btn-primary" style="margin-top: 10px;">
            Guardar
          </button>
        </form>`;
    
    html = html.substring(0, targetStart) + newModal + html.substring(targetEnd);
    fs.writeFileSync('frontend/pages/productos.html', html);
    console.log("Updated HTML with vertical compact modal");
} else {
    console.log("Could not find modal bounds");
}
