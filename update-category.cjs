const fs = require('fs');
let js = fs.readFileSync('frontend/js/productos.js', 'utf8');

const replacementFunc = `
function mostrarInputNuevaCategoria(mostrar) {
  const selectCat = document.getElementById("categoriaProducto");
  const inputCat = document.getElementById("nuevaCategoriaProducto");
  if (mostrar) {
    inputCat.style.display = "block";
    selectCat.style.display = "none";
  } else {
    inputCat.style.display = "none";
    selectCat.style.display = "inline-block";
    inputCat.value = "";
  }
}

btnNuevaCategoria.addEventListener("click", () => {
  mostrarInputNuevaCategoria(true);
  document.getElementById("nuevaCategoriaProducto").focus();
});
`;

if (js.includes('btnNuevaCategoria.addEventListener("click", () => {') && !js.includes('mostrarInputNuevaCategoria')) {
    // Find the original btnNuevaCategoria click listener
    const startIdx = js.indexOf('btnNuevaCategoria.addEventListener("click",');
    const endIdx = js.indexOf('});', startIdx) + 3;
    
    js = js.substring(0, startIdx) + replacementFunc + js.substring(endIdx);
    
    // Also, when editing a product or opening the modal for a new product, we must call mostrarInputNuevaCategoria(false)
    // Find 'function abrirModalNuevo() {' or similar.
    // There is 'btnNuevoProducto.addEventListener("click",'
    const btnNuevoStart = js.indexOf('btnNuevoProducto.addEventListener("click",');
    const btnNuevoEnd = js.indexOf('modalProducto.style.display = "flex";', btnNuevoStart);
    if (btnNuevoStart > -1 && btnNuevoEnd > -1) {
        js = js.substring(0, btnNuevoEnd) + '  mostrarInputNuevaCategoria(false);\n  ' + js.substring(btnNuevoEnd);
    }
    
    // Find editing 'function abrirModalEdicion'
    const editStart = js.indexOf('window.editarProducto = (id) => {');
    // Inside this, they set categoria:
    // `categoriaProducto.value = p.categoria;`
    // I need to intercept this. I'll just write a JS replace script that replaces it properly.
    
    fs.writeFileSync('frontend/js/productos.js', js);
    console.log("Updated btnNuevaCategoria click");
}
