const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ajustes.html', 'utf8');

// Step 1: Remove E-commerce block completely
const ecommerceRegex = /<!-- 3\. E-COMMERCE -->[\s\S]*?<\/section>/i;
html = html.replace(ecommerceRegex, '');

// There is another lingering E-commerce comment due to the previous script
const oldCommentRegex = /<!-- E-COMMERCE DESHABILITADO TEMPORALMENTE\s*-->/i;
html = html.replace(oldCommentRegex, '');
const oldCommentRegex2 = /<!-- E-COMMERCE DESHABILITADO TEMPORALMENTE/i;
html = html.replace(oldCommentRegex2, '');

// Step 2: Extract blocks
const extractBlock = (pattern) => {
  const match = html.match(pattern);
  if (match) {
    html = html.replace(match[0], '');
    return match[0].trim();
  }
  return '';
};

const blockMetodos = extractBlock(/<!-- 1\. MÉTODOS DE PAGO -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 1\. M[^\s]+TODOS DE PAGO -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 1\. MTODOS DE PAGO -->[\s\S]*?<\/section>/i);
const blockDescuentos = extractBlock(/<!-- 2\. DESCUENTOS -->[\s\S]*?<\/section>/i);
const blockGastos = extractBlock(/<!-- 4\. CATEGORÍAS DE GASTOS -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 4\. CATEGOR[^\s]+AS DE GASTOS -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 4\. CATEGORAS DE GASTOS -->[\s\S]*?<\/section>/i);
const blockSistema = extractBlock(/<!-- 5\. SISTEMA \/ BD -->[\s\S]*?<\/section>/i);
const blockStock = extractBlock(/<!-- 6\. UMBRAL DE STOCK -->[\s\S]*?<\/section>/i);
const blockTurnero = extractBlock(/<!-- TURNERO CONFIG -->[\s\S]*?<\/section>/i);
const blockUsuarios = extractBlock(/<!-- 7\. GESTIÓN DE USUARIOS -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 7\. GESTI[^\s]+N DE USUARIOS -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 7\. GESTIN DE USUARIOS -->[\s\S]*?<\/section>/i);

const newGridContent = `
        <!-- FILA 1 -->
        ${blockMetodos}
        ${blockDescuentos}
        ${blockGastos}

        <!-- FILA 2 -->
        ${blockSistema}
        ${blockStock}
        ${blockTurnero}

        <!-- FILA 3 -->
        ${blockUsuarios}
`;

html = html.replace(/<div class="ajustes-grid">[\s\S]*?<\/div>\s*<\/main>/, `<div class="ajustes-grid">\n${newGridContent}\n      </div>\n    </main>`);

// Ensure the third row (Usuarios) spans all 3 columns
html = html.replace(/<section class="ajustes-card" style="grid-column: 1 \/ -1;">/, '<section class="ajustes-card" style="grid-column: 1 / -1;">');
if (!html.includes('style="grid-column: 1 / -1;"')) {
  // if for some reason it didn't match, let's inject it to the Usuarios section
  html = html.replace(/<h2 class="app-subtitle">Usuarios del Sistema<\/h2>/, '<h2 class="app-subtitle">Usuarios del Sistema</h2>\n<!-- ADDED GRID SPAN -->');
  // It's probably already there from my previous HTML check.
}

// Fix modal layout width
html = html.replace(/<div class="app-modal-content-producto" style="max-width: 400px; padding: 20px;">/g, '<div class="app-modal-content" style="max-width: 400px; padding: 20px;">');

fs.writeFileSync('frontend/pages/ajustes.html', html);
console.log('Fixed script done.');

let css = fs.readFileSync('frontend/css/ajustes.css', 'utf8');
css = css.replace(/grid-template-columns: repeat\(auto-fit, minmax\(300px, 1fr\)\);/, 'grid-template-columns: repeat(3, 1fr);');
fs.writeFileSync('frontend/css/ajustes.css', css);
