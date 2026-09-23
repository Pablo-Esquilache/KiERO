const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ajustes.html', 'utf8');

// Step 1: Nuke the E-Commerce block completely.
// It starts with <!-- E-COMMERCE DESHABILITADO TEMPORALMENTE or <!-- 3. E-COMMERCE -->
// We will just regex it out.
const ecommerceRegex = /<!-- (?:E-COMMERCE DESHABILITADO TEMPORALMENTE[\s\S]*?<!-- 3\. E-COMMERCE -->|3\. E-COMMERCE -->)[\s\S]*?<\/section>\s*(?:-->)?/i;
html = html.replace(ecommerceRegex, '');

// Step 2: Extract the other blocks and reorder them.
const extractBlock = (pattern) => {
  const match = html.match(pattern);
  if (match) {
    html = html.replace(match[0], '');
    return match[0].trim();
  }
  return '';
};

const blockMetodos = extractBlock(/<!-- 1\. MÉTODOS DE PAGO -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 1\. M[^\s]+TODOS DE PAGO -->[\s\S]*?<\/section>/i);
const blockDescuentos = extractBlock(/<!-- 2\. DESCUENTOS -->[\s\S]*?<\/section>/i);
const blockGastos = extractBlock(/<!-- 4\. CATEGORÍAS DE GASTOS -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 4\. CATEGOR[^\s]+AS DE GASTOS -->[\s\S]*?<\/section>/i);
const blockSistema = extractBlock(/<!-- 5\. SISTEMA \/ BD -->[\s\S]*?<\/section>/i);
const blockStock = extractBlock(/<!-- 6\. UMBRAL DE STOCK -->[\s\S]*?<\/section>/i);
const blockTurnero = extractBlock(/<!-- TURNERO CONFIG -->[\s\S]*?<\/section>/i);
const blockUsuarios = extractBlock(/<!-- 7\. GESTIÓN DE USUARIOS -->[\s\S]*?<\/section>/i) || extractBlock(/<!-- 7\. GESTI[^\s]+N DE USUARIOS -->[\s\S]*?<\/section>/i);

const newGridContent = `
        <!-- FILA 1 -->
        \${blockMetodos}
        \${blockDescuentos}
        \${blockGastos}

        <!-- FILA 2 -->
        \${blockSistema}
        \${blockStock}
        \${blockTurnero}

        <!-- FILA 3 -->
        \${blockUsuarios}
`;

html = html.replace(/<div class="ajustes-grid">[\s\S]*?<\/div>\s*<\/main>/, `<div class="ajustes-grid">\${newGridContent}\n      </div>\n    </main>`);

// Fix modal class for Usuarios to be standard 'app-modal-content' instead of 'app-modal-content-producto'
html = html.replace(/<div class="app-modal-content-producto" style="max-width: 400px; padding: 20px;">/g, '<div class="app-modal-content" style="max-width: 400px; padding: 20px;">');

fs.writeFileSync('frontend/pages/ajustes.html', html);
console.log('ajustes.html reorganized.');

let css = fs.readFileSync('frontend/css/ajustes.css', 'utf8');
css = css.replace(/grid-template-columns: repeat\(auto-fit, minmax\(300px, 1fr\)\);/, 'grid-template-columns: repeat(3, 1fr);');
fs.writeFileSync('frontend/css/ajustes.css', css);
console.log('ajustes.css updated to strict 3 columns.');
