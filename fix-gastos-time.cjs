const fs = require('fs');

let js = fs.readFileSync('backend/controllers/gastosController.js', 'utf8');

const regexCreate = /export const createGasto = async \(req, res\) => \{\s*const \{ fecha, descripcion, tipo, importe, comercio_id \} = req\.body;/;

const newCreate = `export const createGasto = async (req, res) => {
  let { fecha, descripcion, tipo, importe, comercio_id } = req.body;
  
  // Si la fecha es igual a hoy, le anexamos la hora actual para que ingrese correctamente a la caja abierta de hoy.
  const hoyStr = new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD local
  if (fecha === hoyStr) {
    fecha = new Date().toISOString(); 
  }
`;

if (js.match(regexCreate)) {
  js = js.replace(regexCreate, newCreate);
  fs.writeFileSync('backend/controllers/gastosController.js', js);
  console.log('Fixed current time appending in createGasto');
} else {
  console.log('Regex create failed');
}

// Do the same for updateGasto just in case they edit it to today
const regexUpdate = /export const updateGasto = async \(req, res\) => \{\s*const \{ id \} = req\.params;\s*const \{ fecha, descripcion, tipo, importe, comercio_id \} = req\.body;/;

const newUpdate = `export const updateGasto = async (req, res) => {
  const { id } = req.params;
  let { fecha, descripcion, tipo, importe, comercio_id } = req.body;
  
  const hoyStr = new Date().toLocaleDateString("sv-SE");
  if (fecha === hoyStr) {
    fecha = new Date().toISOString(); 
  }
`;

if (js.match(regexUpdate)) {
  js = js.replace(regexUpdate, newUpdate);
  fs.writeFileSync('backend/controllers/gastosController.js', js);
  console.log('Fixed current time appending in updateGasto');
} else {
  console.log('Regex update failed');
}

