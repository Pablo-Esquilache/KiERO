const fs = require('fs');
let html = fs.readFileSync('frontend/pages/clientes.html', 'utf8');

// The end of the file looks like:
/*
      </div>
      </div>
  
      <script type="module" src="../js/clientes.js"></script>
*/

html = html.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<script type="module" src="\.\.\/js\/clientes\.js"><\/script>/,
  '</div>\n    </div>\n\n    <script type="module" src="../js/clientes.js"></script>');

fs.writeFileSync('frontend/pages/clientes.html', html);
console.log('Fixed extra div');
