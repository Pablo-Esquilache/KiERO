const fs = require('fs');

let js = fs.readFileSync('backend/controllers/exportarController.js', 'utf8');

js = js.replace(
  'const { rows } = await db.query(queryStr, [comercio_id]);',
  `let rows = [];
        try {
          const res = await db.query(queryStr, [comercio_id]);
          rows = res.rows;
        } catch (e) {
          console.warn(\`Skipping table \${tabla} due to error: \`, e.message);
          continue;
        }`
);

fs.writeFileSync('backend/controllers/exportarController.js', js);
console.log('Added try-catch to loop in exportarController.js');
