const fs = require('fs');
const path = require('path');

const controllersDir = path.join(__dirname, 'controllers');
const files = fs.readdirSync(controllersDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
  const filePath = path.join(controllersDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // req.query replacements
  content = content.replace(/const\s+\{\s*comercio_id\s*\}\s*=\s*req\.query;/g, 'const comercio_id = req.user.comercio_id;');
  
  // Destructured queries with other vars
  content = content.replace(/const\s+\{\s*comercio_id,\s*(.*?)\}\s*=\s*req\.query;/g, 'const { $1 } = req.query;\n  const comercio_id = req.user.comercio_id;');
  content = content.replace(/const\s+\{\s*(.*?),\s*comercio_id\s*\}\s*=\s*req\.query;/g, 'const { $1 } = req.query;\n  const comercio_id = req.user.comercio_id;');
  // Triple destructured (like reportesController)
  content = content.replace(/const\s+\{\s*comercio_id,\s*(.*?),\s*(.*?)\s*\}\s*=\s*req\.query;/g, 'const { $1, $2 } = req.query;\n  const comercio_id = req.user.comercio_id;');
  content = content.replace(/const\s+\{\s*comercio_id,\s*(.*?),\s*(.*?),\s*(.*?)\s*\}\s*=\s*req\.query;/g, 'const { $1, $2, $3 } = req.query;\n  const comercio_id = req.user.comercio_id;');
  
  // specifically for reportesController: const { comercio_id, agrupacion = "dia", desde, hasta } = req.query;
  content = content.replace(/const\s+\{\s*comercio_id,\s*agrupacion\s*=\s*"dia",\s*desde,\s*hasta\s*\}\s*=\s*req\.query;/g, 'const { agrupacion = "dia", desde, hasta } = req.query;\n  const comercio_id = req.user.comercio_id;');
  content = content.replace(/const\s+\{\s*comercio_id,\s*desde,\s*hasta,\s*limit\s*=\s*10\s*\}\s*=\s*req\.query;/g, 'const { desde, hasta, limit = 10 } = req.query;\n  const comercio_id = req.user.comercio_id;');
  content = content.replace(/const\s+\{\s*comercio_id,\s*desde,\s*hasta\s*\}\s*=\s*req\.query;/g, 'const { desde, hasta } = req.query;\n  const comercio_id = req.user.comercio_id;');

  // TurnosController specifically: 
  content = content.replace(/const cid = comercio_id \|\| req\.query\.comercio_id;/g, 'const cid = req.user.comercio_id;');
  content = content.replace(/const cid = req\.query\.comercio_id \|\| req\.body\.comercio_id;/g, 'const cid = req.user.comercio_id;');
  content = content.replace(/const\s+\{\s*comercio_id,\s*fecha\s*\}\s*=\s*req\.query;/g, 'const { fecha } = req.query;\n  const comercio_id = req.user.comercio_id;');

  // CajasController params specifically
  content = content.replace(/const\s+\{\s*comercioId\s*\}\s*=\s*req\.params;/g, 'const comercioId = req.user.comercio_id;');


  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Patched req.query IDOR in ${file}`);
  }
});
