const fs = require('fs');
let js = fs.readFileSync('frontend/js/ventas.js', 'utf8');

const logicToInject = `
// ==========================================
// TICKET EXITO (Aceptar e Imprimir)
// ==========================================
const btnAceptarTicketExito = document.getElementById("btnAceptarTicketExito");
const modalTicketExito = document.getElementById("modalTicketExito");

if (btnAceptarTicketExito && modalTicketExito) {
  btnAceptarTicketExito.addEventListener("click", () => {
    modalTicketExito.style.display = "none";
  });
}

const btnImprimirTicketExito = document.getElementById("btnImprimirTicketExito");
if (btnImprimirTicketExito) {
  btnImprimirTicketExito.addEventListener("click", () => {
    const contenido = document.getElementById("ticketExitoContenido")?.innerHTML || "";
    const ventana = window.open('', '_blank', 'width=300,height=500');
    ventana.document.write('<html><head><title>Imprimir Ticket</title></head><body style="font-family: monospace;">');
    ventana.document.write('<h3 style="text-align:center;">Comprobante de Venta</h3>');
    ventana.document.write(contenido);
    ventana.document.write('</body></html>');
    ventana.document.close();
    ventana.onload = () => {
      ventana.print();
      ventana.close();
    };
  });
}
`;

if (!js.includes('btnAceptarTicketExito.addEventListener')) {
  fs.writeFileSync('frontend/js/ventas.js', js + logicToInject);
  console.log("Injected btnAceptarTicketExito logic");
} else {
  console.log("Already injected");
}
