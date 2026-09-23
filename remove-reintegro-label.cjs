const fs = require('fs');

let html = fs.readFileSync('frontend/pages/ventas.html', 'utf8');

// The block to remove is:
// <div class="app-form-group">
//   <label>MǸtodo de reintegro (Si aplica)</label>
//   
// </div>

const pattern = /<div class="app-form-group">\s*<label>M[^t]+todo de reintegro \(Si aplica\)<\/label>\s*<\/div>/g;

if (pattern.test(html)) {
  html = html.replace(pattern, '');
  fs.writeFileSync('frontend/pages/ventas.html', html);
  console.log('Removed empty form group for Reintegro');
} else {
  // Let's try a broader replacement if encoding is weird
  const backupPattern = /<div class="app-form-group">\s*<label>[^<]*reintegro[^<]*<\/label>\s*<\/div>/g;
  if (backupPattern.test(html)) {
    html = html.replace(backupPattern, '');
    fs.writeFileSync('frontend/pages/ventas.html', html);
    console.log('Removed empty form group using backup pattern');
  } else {
    console.log('Could not find the block to remove');
  }
}
