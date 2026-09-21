const fs = require('fs');
let css = fs.readFileSync('frontend/css/caja.css', 'utf8');

const targetStr = '.card-efectivo { border-left-color: #10b981; }';
const newStr = '.card-inicial { border-left-color: #64748b; }       /* Gris oscuro */\n.card-efectivo { border-left-color: #10b981; }';

if (css.includes(targetStr)) {
    css = css.replace(targetStr, newStr);
    fs.writeFileSync('frontend/css/caja.css', css);
    console.log('CSS updated');
} else {
    console.log('CSS target not found');
}
