const fs = require('fs');

let lines = fs.readFileSync('frontend/js/ajustes.js', 'utf8').split('\n');

for (let i = 12; i <= 67; i++) {
  // Comment out lines 13 to 68 (0-indexed 12 to 67)
  if (!lines[i].startsWith('//')) {
    lines[i] = '// ' + lines[i];
  }
}

// Write the lines back to a string
let js = lines.join('\n');

// Also replace the call
js = js.replace('cargarConfigSync();', '// cargarConfigSync();');

fs.writeFileSync('frontend/js/ajustes.js', js);
console.log('ajustes.js fixed');
