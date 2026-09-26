const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// Sales autocomplete mousedown
js = js.replace(/if\(productoVentaV\) productoVentaV\.value = p\.id;\n\s*if\(productoVentaNombreV\) productoVentaNombreV\.value = p\.nombre;\n\s*if\(autocompleteProductosV\) autocompleteProductosV\.style\.display = "none";/,
`if(productoVentaV) productoVentaV.value = p.id;
        if(productoVentaNombreV) productoVentaNombreV.value = p.nombre;
        if(autocompleteProductosV) autocompleteProductosV.style.display = "none";
        
        const precioCustomInput = document.getElementById("precioCustomVenta");
        if (p.precio_abierto) {
          precioCustomInput.style.display = "inline-block";
          precioCustomInput.value = "";
          precioCustomInput.focus();
        } else {
          precioCustomInput.style.display = "none";
          if(cantidadVentaV) cantidadVentaV.focus();
        }`);

// Returns autocomplete mousedown
js = js.replace(/if\(productoDevolucionV\) productoDevolucionV\.value = p\.id;\n\s*if\(productoDevolucionNombreV\) productoDevolucionNombreV\.value = p\.nombre;\n\s*if\(autocompleteProductosDevolucionV\) autocompleteProductosDevolucionV\.style\.display = "none";/,
`if(productoDevolucionV) productoDevolucionV.value = p.id;
        if(productoDevolucionNombreV) productoDevolucionNombreV.value = p.nombre;
        if(autocompleteProductosDevolucionV) autocompleteProductosDevolucionV.style.display = "none";
        
        const precioCustomDevInput = document.getElementById("precioCustomDevolucion");
        if (p.precio_abierto) {
          precioCustomDevInput.style.display = "inline-block";
          precioCustomDevInput.value = "";
          precioCustomDevInput.focus();
        } else {
          precioCustomDevInput.style.display = "none";
          if(cantidadDevolucionV) cantidadDevolucionV.focus();
        }`);

// Sales button add
js = js.replace(/btnAgregarProducto\?\.addEventListener\("click", \(\) => {\n\s*const productoId = productoVenta\?\.value;\n\s*const cantidad = Number\(cantidadVenta\?\.value\);\n\s*if \(\!productoId \|\| \!cantidad \|\| cantidad <= 0\) {\n\s*toastInfo\("Seleccioná un producto y una cantidad válida"\);\n\s*return;\n\s*}\n\s*procesarAgregarProducto\(productoId, cantidad\);/,
`btnAgregarProducto?.addEventListener("click", () => {
    const productoId = productoVenta?.value;
    const cantidad = Number(cantidadVenta?.value);
    
    const precioCustomInput = document.getElementById("precioCustomVenta");
    let precioCustom = null;
    if (precioCustomInput && precioCustomInput.style.display !== "none") {
      precioCustom = Number(precioCustomInput.value);
      if (!precioCustom || precioCustom <= 0) {
        toastWarning("Ingrese un precio válido para este comodín.");
        return;
      }
    }
    
    if (!productoId || !cantidad || cantidad <= 0) {
      toastInfo("Seleccioná un producto y una cantidad válida");
      return;
    }
    
    procesarAgregarProducto(productoId, cantidad, precioCustom);
    if(precioCustomInput) {
      precioCustomInput.style.display = "none";
      precioCustomInput.value = "";
    }`);

// Sales Add Function
js = js.replace(/function procesarAgregarProducto\(productoId, cantidadAgregada\) {/,
`function procesarAgregarProducto(productoId, cantidadAgregada, precioCustom = null) {`);

js = js.replace(/const subtotal = Number\(producto\.precio\) \* cantidadAgregada;\n\s*const item = {\n\s*producto_id: producto\.id,\n\s*nombre: producto\.nombre,\n\s*cantidad: cantidadAgregada,\n\s*precio_unitario: Number\(producto\.precio\),\n\s*subtotal: subtotal,\n\s*};/,
`const precioFinal = (producto.precio_abierto && precioCustom) ? precioCustom : Number(producto.precio);
  const subtotal = precioFinal * cantidadAgregada;

  const item = {
    producto_id: producto.id,
    nombre: producto.nombre,
    cantidad: cantidadAgregada,
    precio_unitario: precioFinal,
    subtotal: subtotal,
  };`);


// Returns button add
js = js.replace(/btnAgregarDevolucionNuevo\?\.addEventListener\("click", \(\) => {\n\s*const prodId = productoDevolucion\?\.value;\n\s*const cant = Number\(cantidadDevolucion\?\.value\);\n\s*if \(\!prodId\) {\n\s*toastInfo\("Seleccioná un producto de la lista"\);\n\s*return;\n\s*}\n\s*if \(\!cant \|\| cant <= 0\) {\n\s*toastInfo\("Ingresá una cantidad válida"\);\n\s*return;\n\s*}/,
`btnAgregarDevolucionNuevo?.addEventListener("click", () => {
    const prodId = productoDevolucion?.value;
    const cant = Number(cantidadDevolucion?.value);
    
    const precioCustomInput = document.getElementById("precioCustomDevolucion");
    let precioCustom = null;
    if (precioCustomInput && precioCustomInput.style.display !== "none") {
      precioCustom = Number(precioCustomInput.value);
      if (!precioCustom || precioCustom <= 0) {
        toastWarning("Ingrese un precio válido para devolver este comodín.");
        return;
      }
    }
    
    if (!prodId) {
      toastInfo("Seleccioná un producto de la lista");
      return;
    }
    if (!cant || cant <= 0) {
      toastInfo("Ingresá una cantidad válida");
      return;
    }`);

js = js.replace(/const prodCache = productosCache\.find\(\(p\) => p\.id == prodId\);\n\s*const subtotal = Number\(prodCache\.precio\) \* cant;\n\s*const nuevoItem = {\n\s*producto_id: prodId,\n\s*nombre: prodCache\.nombre,\n\s*cantidad: cant,\n\s*precio: Number\(prodCache\.precio\),\n\s*subtotal: subtotal,\n\s*};/,
`const prodCache = productosCache.find((p) => p.id == prodId);
    const precioFinal = (prodCache.precio_abierto && precioCustom) ? precioCustom : Number(prodCache.precio);
    const subtotal = precioFinal * cant;

    const nuevoItem = {
      producto_id: prodId,
      nombre: prodCache.nombre,
      cantidad: cant,
      precio: precioFinal,
      precio_unitario: precioFinal,
      subtotal: subtotal,
    };
    if (precioCustomInput) {
      precioCustomInput.style.display = "none";
      precioCustomInput.value = "";
    }`);

// Barcode intercept for Sales
js = js.replace(/if \(\!productoEncontrado\) {\n\s*toastInfo\(`No se encontró producto con código: \$\{codigo\}`\);\n\s*scannerInput\.value = "";\n\s*return;\n\s*}\n\s*procesarAgregarProducto\(productoEncontrado\.id, 1\);/,
`if (!productoEncontrado) {
        toastInfo(\`No se encontró producto con código: \${codigo}\`);
        scannerInput.value = "";
        return;
      }
      
      if (productoEncontrado.precio_abierto) {
        // Intercept: don't auto-add. Select it and wait for price.
        const productoVentaV = document.getElementById("productoVenta");
        const productoVentaNombreV = document.getElementById("productoVentaNombre");
        const precioCustomInput = document.getElementById("precioCustomVenta");
        
        if (productoVentaV) productoVentaV.value = productoEncontrado.id;
        if (productoVentaNombreV) productoVentaNombreV.value = productoEncontrado.nombre;
        if (precioCustomInput) {
          precioCustomInput.style.display = "inline-block";
          precioCustomInput.value = "";
          precioCustomInput.focus();
        }
        toastInfo("Ingrese el precio para el producto comodín.");
      } else {
        procesarAgregarProducto(productoEncontrado.id, 1);
      }`);

fs.writeFileSync('frontend/js/ventas.js', js);
console.log("Success js ventas replace");
