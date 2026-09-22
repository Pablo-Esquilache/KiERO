const fs = require('fs');
let css = fs.readFileSync('frontend/css/productos.css', 'utf8');

const targetStr = `.app-info-excel {
  background: #252525;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 14px;
}`;

const targetRegex = /\\.app-info-excel\s*\{[^}]+\}/;

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

if (css.match(targetRegex)) {
    css = css.replace(targetRegex, newInfo);
    fs.writeFileSync('frontend/css/productos.css', css);
    console.log('Fixed CSS');
} else {
    console.log('Not found');
}
