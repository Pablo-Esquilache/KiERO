const fs = require('fs');
const clientesHTML = fs.readFileSync('frontend/pages/clientes.html', 'utf8');
const productosHTML = fs.readFileSync('frontend/pages/productos.html', 'utf8');

const getModal = (html, modalId) => {
    const start = html.indexOf(`id="${modalId}"`);
    if (start === -1) return "Not found";
    const content = html.substring(start - 50, start + 2500);
    return content;
};

console.log("=== CLIENTES MODAL ===");
console.log(getModal(clientesHTML, "modalCliente"));

console.log("\\n\\n=== PRODUCTOS MODAL ===");
console.log(getModal(productosHTML, "modalProducto"));
