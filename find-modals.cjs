const fs = require('fs');
const html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');
const match = html.match(/id="modal.*?"/g);
console.log(match);
