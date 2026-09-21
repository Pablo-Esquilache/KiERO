const fs = require('fs');
const html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');

const modalStart = html.indexOf('class="app-modal"');
if (modalStart > -1) {
    let tagStart = html.lastIndexOf('<', modalStart);
    let modalId = '';
    const idMatch = html.substring(tagStart, modalStart+20).match(/id="([^"]+)"/);
    if (idMatch) modalId = idMatch[1];
    console.log("Found modal:", modalId);
    console.log(html.substring(tagStart, tagStart + 2000));
}
