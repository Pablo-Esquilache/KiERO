const fs = require('fs');

const oldJs = fs.readFileSync('ventas_old.js', 'utf8');
const currentJs = fs.readFileSync('frontend/js/ventas.js', 'utf8');

// The block starts around "Expose Clientes to Modal"
const startMarker = '// Expose Clientes to Modal';
const endMarker = 'const btnNuevoClienteDesdeBuscador = document.getElementById("btnNuevoClienteDesdeBuscador");';

const startIndex = oldJs.indexOf(startMarker);
const endIndex = oldJs.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  let missingBlock = oldJs.substring(startIndex, endIndex);
  
  // Clean up the broken scroll logic in the missing block because we moved it to the bottom
  const brokenScrollMatch = missingBlock.match(/const modalTablaContainer = document\.querySelector\("#modalBuscarCliente \.v-tabla-container"\);[\s\S]*?\}\n\s*\}\);\n/);
  if (brokenScrollMatch) {
    missingBlock = missingBlock.replace(brokenScrollMatch[0], '');
  }
  
  // Remove the old openClientModal declaration if we want it global
  // Actually, we can just inject this missing block into the DOMContentLoaded event or at the top level
  // Since it relies on DOM elements, let's inject it inside the POS REFACTOR LOGIC DOMContentLoaded block
  
  // Find where to inject
  const injectMarker = '// ==============================';
  const posRefactorMarker = '// POS REFACTOR LOGIC';
  
  const insertPos = currentJs.indexOf(posRefactorMarker);
  
  if (insertPos !== -1) {
    // Just inject it after POS REFACTOR LOGIC
    const newJs = currentJs.substring(0, insertPos) + posRefactorMarker + '\n' + missingBlock + currentJs.substring(insertPos + posRefactorMarker.length);
    fs.writeFileSync('frontend/js/ventas.js', newJs);
    console.log('Restored missing block successfully');
  } else {
    console.log('Could not find POS REFACTOR LOGIC marker');
  }
} else {
  console.log('Could not find markers in old js');
}
