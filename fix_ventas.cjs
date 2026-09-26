const fs = require('fs');
let c = fs.readFileSync('backend/controllers/ventasController.js', 'utf8');

// Replace COALESCE($8, NOW()) with NOW()
c = c.replace(/VALUES \(COALESCE\(\$8, NOW\(\)\), \$1,\$2,\$3,\$4,\$5,\$6,\$7\)/g, "VALUES (CURRENT_TIMESTAMP, $1,$2,$3,$4,$5,$6,$7)");

// And remove the 8th parameter from the array
c = c.replace(/comercio_id,\s*\(fecha && fecha\.length === 10\) \? fecha \+ "T12:00:00Z" : \(fecha \|\| null\)\s*\]/g, "comercio_id\n        ]");

fs.writeFileSync('backend/controllers/ventasController.js', c);
