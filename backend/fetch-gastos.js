// Fetch gastos from the API to see exactly what date string the frontend receives.
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/gastos/1', // Need the correct comercioId, we can get it from DB or just query it
  method: 'GET'
};

// Actually, I don't know the exact port of the backend. Let's just run a DB query using `psql` if possible.
