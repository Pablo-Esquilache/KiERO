const fs = require('fs');
let css = fs.readFileSync('frontend/css/productos.css', 'utf8');

const targetStr = `.app-info-excel {
  background: #252525;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}`;
// If formatting differs, I'll use regex:
const regexInfo = /\\.app-info-excel\s*\{[\s\S]*?\}/;
const newInfo = `.app-info-excel {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
}`;

css = css.replace(regexInfo, newInfo);

// The file input style
const regexInput = /#inputExcelProductos\s*\{[\s\S]*?\}/;
const newInput = `#inputExcelProductos {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px dashed #ccc;
  border-radius: 6px;
  width: 100%;
  cursor: pointer;
}`;
css = css.replace(regexInput, newInput);

fs.writeFileSync('frontend/css/productos.css', css);
console.log('CSS updated');
