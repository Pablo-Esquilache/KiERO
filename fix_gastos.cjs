const fs = require('fs');
let c = fs.readFileSync('backend/controllers/gastosController.js', 'utf8');

c = c.replace(/VALUES \(\$1, \$2, \$3, \$4, \$5\)/, 
  "VALUES (CASE WHEN $1::date = CURRENT_DATE THEN CURRENT_TIMESTAMP ELSE $1::timestamp END, $2, $3, $4, $5)");

fs.writeFileSync('backend/controllers/gastosController.js', c);
