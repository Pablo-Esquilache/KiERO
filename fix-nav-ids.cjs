const fs = require('fs');
const path = require('path');

const pagesDir = 'frontend/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let html = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Add IDs if they are missing
  if (html.includes('<li><a href="caja.html"')) {
    html = html.replace(/<li><a href="caja\.html"/g, '<li id="tab-caja"><a href="caja.html"');
    changed = true;
  }
  if (html.includes('<li><a href="ventas.html"')) {
    html = html.replace(/<li><a href="ventas\.html"/g, '<li id="tab-ventas"><a href="ventas.html"');
    changed = true;
  }
  if (html.includes('<li><a href="productos.html"')) {
    html = html.replace(/<li><a href="productos\.html"/g, '<li id="tab-productos"><a href="productos.html"');
    changed = true;
  }
  if (html.includes('<li><a href="clientes.html"')) {
    html = html.replace(/<li><a href="clientes\.html"/g, '<li id="tab-clientes"><a href="clientes.html"');
    changed = true;
  }
  if (html.includes('<li><a href="gastos.html"')) {
    html = html.replace(/<li><a href="gastos\.html"/g, '<li id="tab-gastos"><a href="gastos.html"');
    changed = true;
  }
  // Turnos and Reportes usually already have IDs, but let's check just in case.
  if (html.includes('<li><a href="reportes.html"')) {
    html = html.replace(/<li><a href="reportes\.html"/g, '<li id="tab-reportes"><a href="reportes.html"');
    changed = true;
  }
  if (html.includes('<li><a href="turnos.html"')) {
    html = html.replace(/<li><a href="turnos\.html"/g, '<li id="tab-turnero"><a href="turnos.html"');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, html);
    console.log(`Updated IDs in ${file}`);
  }
});
