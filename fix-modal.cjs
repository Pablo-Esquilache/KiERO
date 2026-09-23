const fs = require('fs');
let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

const modalRegex = /<form id="formDevolucion" class="app-form-venta" style="justify-content: flex-start; gap: 20px;">[\s\S]*?<div class="app-tabla-container"/;

const newModalForm = `<form id="formDevolucion" style="display: flex; flex-direction: column; gap: 10px;">
          <div class="app-form-group" style="margin-bottom: 0;">
            <label>Cliente (Opcional - Consumidor Final si se omite)</label>
            <input type="hidden" id="clienteDevolucion">
            <div style="display: flex; gap: 8px;">
              <div style="position: relative; flex: 1;">
                <input type="text" id="clienteDevolucionNombre" class="app-input" style="width: 100%; height: 38px;" placeholder="Buscar cliente..." autocomplete="off">
                <ul id="autocompleteClientesDevolucion" class="app-autocomplete-list" style="display:none; width: 100%;"></ul>
              </div>
              <button type="button" id="btnBuscarClienteDev" class="app-btn-secondary" style="padding: 0 15px; height: 38px;" title="Búsqueda Avanzada">🔍</button>
            </div>
          </div>

          <div class="app-form-group" style="margin-bottom: 0;">
            <label>Producto a devolver</label>
            <div style="display: flex; gap: 8px;">
              <div style="position: relative; flex: 1;">
                <input type="hidden" id="productoDevolucion">
                <input type="text" id="productoDevolucionNombre" class="app-input" style="width: 100%; height: 38px;" placeholder="Buscar producto..." autocomplete="off">
                <ul id="autocompleteProductosDevolucion" class="app-autocomplete-list" style="display:none; width: 100%;"></ul>
              </div>
              <button type="button" id="btnBuscarProductoDev" class="app-btn-secondary" style="padding: 0 15px; height: 38px;" title="Búsqueda Avanzada">🔍</button>
            </div>
          </div>
          
          <div style="display: flex; gap: 10px;">
            <div class="app-form-group" style="margin-bottom: 0; flex: 1;">
              <label>Cantidad</label>
              <input
                type="number"
                id="cantidadDevolucion"
                class="app-input"
                min="1"
                placeholder="Cant."
                style="height: 38px;"
              />
            </div>
            
            <div class="app-form-group" style="margin-bottom: 0; flex: 1; display: flex; align-items: flex-end;">
              <button
                type="button"
                id="btnAgregarDevolucion"
                class="app-btn-secondary"
                style="height: 38px; width: 100%; padding: 0;"
              >
                Agregar
              </button>
            </div>
          </div>

          <div class="app-tabla-container"`;

html = html.replace(modalRegex, newModalForm);

// Ensure the max-height is even bigger
html = html.replace(
  /<div class="app-tabla-container" style="max-height: 350px; min-height: 0; margin-top: 15px;">/,
  '<div class="app-tabla-container" style="max-height: 400px; min-height: 0; margin-top: 10px;">'
);

fs.writeFileSync('frontend/pages/ventas.html', html);
console.log('Fixed devolucion layout');
