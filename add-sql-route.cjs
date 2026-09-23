const fs = require('fs');
let js = fs.readFileSync('backend/routes/deacragaExcel.js', 'utf8');

js = js.replace(
  'import { exportarExcel } from "../controllers/exportarController.js";',
  'import { exportarExcel, exportarBackupSQL } from "../controllers/exportarController.js";'
);
js = js.replace(
  'export default router;',
  'router.get("/sql", exportarBackupSQL);\n\nexport default router;'
);

fs.writeFileSync('backend/routes/deacragaExcel.js', js);
console.log('Added /sql route');
