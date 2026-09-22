const fs = require('fs');
let css = fs.readFileSync('frontend/css/productos.css', 'utf8');

const targetStr = `
.app-info-excel {
  background: #252525;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}`;

const newInfo = `
.app-info-excel {
  background: #f8fafc;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  line-height: 1.5;
}`;

// I'll manually find the start
const startIdx = css.indexOf('.app-info-excel {');
if (startIdx > -1) {
    const endIdx = css.indexOf('}', startIdx) + 1;
    css = css.substring(0, startIdx) + newInfo.trim() + css.substring(endIdx);
    fs.writeFileSync('frontend/css/productos.css', css);
    console.log('Fixed CSS by index');
} else {
    console.log('Not found by index');
}
