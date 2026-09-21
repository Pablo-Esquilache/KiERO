const fs = require('fs');
let js = fs.readFileSync('frontend/js/system.js', 'utf8');

const targetCode = `    const navLinks = document.querySelectorAll(".app-navbar-menu a");
    let ventasLink = null;
    navLinks.forEach(link => {
      if (link.getAttribute("href") === "ventas.html") {
        ventasLink = link;
      }
    });`;

const newCode = `    const ventasLink = document.querySelector("#tab-ventas a");`;

if (js.includes(targetCode)) {
    js = js.replace(targetCode, newCode);
    fs.writeFileSync('frontend/js/system.js', js);
    console.log("system.js selector updated");
} else {
    console.log("Selector block not found");
}
