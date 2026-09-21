const fs = require('fs');
let js = fs.readFileSync('frontend/js/system.js', 'utf8');

const targetStr = `// ==========================================
// VALIDACIÓN GLOBAL: CAJA ABIERTA PARA VENTAS
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {`;
const newStr = `// ==========================================
// VALIDACIÓN GLOBAL: CAJA ABIERTA PARA VENTAS
// ==========================================
(async () => {`;

if (js.includes(targetStr)) {
    js = js.replace(targetStr, newStr);
    // Remove the last '});' and replace with '})();'
    const lastIndex = js.lastIndexOf('});');
    if (lastIndex > -1) {
        js = js.substring(0, lastIndex) + '})();' + js.substring(lastIndex + 3);
        fs.writeFileSync('frontend/js/system.js', js);
        console.log("system.js updated");
    } else {
        console.log("Could not find ending");
    }
} else {
    console.log("Could not find start");
}
