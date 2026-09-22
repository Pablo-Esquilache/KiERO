const fs = require('fs');
let js = fs.readFileSync('frontend/js/clientes.js', 'utf8');

const errorBlock = `}>
        <td>\${m.tipo}</td>
        <td>\${m.tipo === "venta" ? "+" : "-"}$\${Number(m.monto).toFixed(2)}</td>
      </tr>
    \`;
  });
}`;

js = js.replace(errorBlock, '}');
fs.writeFileSync('frontend/js/clientes.js', js);
console.log('Fixed syntax error');
