const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // We want to replace req.body.comercio_id with req.user.comercio_id, but usually it's destructured.
  // Example: const { nombre, precio, comercio_id } = req.body;
  // If we just inject const comercio_id = req.user.comercio_id; right after the body destructuring, it will throw an error if `comercio_id` was also destructured (Identifier has already been declared).
  
  // Strategy: 
  // 1. Remove `comercio_id, ` and `, comercio_id` from the destructurings.
  content = content.replace(/,\s*comercio_id\s*,/g, ', ');
  content = content.replace(/\{\s*comercio_id\s*,/g, '{ ');
  content = content.replace(/,\s*comercio_id\s*\}/g, ' }');
  content = content.replace(/const\s+\{\s*comercio_id\s*\}\s*=\s*req\.body;/g, '');

  // 2. But we need comercio_id to be declared for the inserts! 
  // So we'll find every instance of req.body; and append const comercio_id = req.user.comercio_id;
  content = content.replace(/=\s*req\.body;/g, '= req.body;\n  const comercio_id = req.user.comercio_id;');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Patched req.body IDOR in ${file}`);
  }
});
