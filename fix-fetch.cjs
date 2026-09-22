const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const oldFetch = `const res = await fetch("/api/devoluciones", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + session?.token },
      body: JSON.stringify(payload)
    });
    
    if(!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al generar devolución");
    }`;

const newFetch = `const data = await DevolucionesAPI.create(JSON.stringify(payload));`;

js = js.replace(oldFetch, newFetch);
fs.writeFileSync('frontend/js/ventas.js', js);
