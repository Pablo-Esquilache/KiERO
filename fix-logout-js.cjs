const fs = require('fs');
let js = fs.readFileSync('frontend/js/logout.js', 'utf8');

const backupRegex = /\/\/ ==========================================\s*\n\/\/ Botón de Copia de Seguridad Manual\s*\n\/\/ ==========================================\s*\nconst backupBtn[\s\S]*\}\);\s*\n\}/;

if (backupRegex.test(js)) {
    js = js.replace(backupRegex, '');
    fs.writeFileSync('frontend/js/logout.js', js.trim() + '\n');
    console.log('Removed backup logic from logout.js');
} else {
    // maybe encoding issues, let's just substring everything after "const logoutBtn = document.getElementById("logout-btn");" up to its block end.
    console.log('Regex did not match');
}
