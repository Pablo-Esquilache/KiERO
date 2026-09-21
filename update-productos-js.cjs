const fs = require('fs');
let js = fs.readFileSync('frontend/js/productos.js', 'utf8');

const helperCode = `
// ------------------------------
// MANEJO DE CATEGORÍA
// ------------------------------
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

// Replace the old btnNuevaCategoria logic
const oldBtnClick = `btnNuevaCategoria.addEventListener("click", () => {
  nuevaCategoriaProducto.style.display = "block";
  nuevaCategoriaProducto.focus();
});`;
const oldBtnClick2 = `btnNuevaCategoria.addEventListener("click", () => {
    nuevaCategoriaProducto.style.display = "block";
    nuevaCategoriaProducto.focus();
  });`;

js = js.replace(oldBtnClick, helperCode);
js = js.replace(oldBtnClick2, helperCode);

// Also replace the other old logic if it had categoriaProducto.style.display = "none"
if (!js.includes('mostrarInputNuevaCategoria')) {
    js = js.replace(/btnNuevaCategoria\.addEventListener\("click"[\s\S]*?\}\);/, helperCode);
}


// Add initialization call to btnNuevoProducto
const btnNuevoRegex = /btnNuevoProducto\.addEventListener\("click",\s*\(\)\s*=>\s*\{/;
js = js.replace(btnNuevoRegex, `btnNuevoProducto.addEventListener("click", () => {\n  mostrarInputNuevaCategoria(false);`);

// Update editarProducto
const editTarget = `  categoriaProducto.value = p.categoria || "";`;
const editReplacement = `  const categoriasExistentes = Array.from(categoriaProducto.options).map(opt => opt.value);
  if (p.categoria && categoriasExistentes.includes(p.categoria)) {
    mostrarInputNuevaCategoria(false);
    categoriaProducto.value = p.categoria;
  } else if (p.categoria) {
    mostrarInputNuevaCategoria(true);
    document.getElementById("nuevaCategoriaProducto").value = p.categoria;
  } else {
    mostrarInputNuevaCategoria(false);
    categoriaProducto.value = "";
  }`;

js = js.replace(editTarget, editReplacement);

fs.writeFileSync('frontend/js/productos.js', js);
console.log('JS Updated');
