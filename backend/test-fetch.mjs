// test API
fetch('http://localhost:3000/api/gastos/1')
  .then(res => res.json())
  .then(data => console.log("DATA:", data.slice(0, 3)))
  .catch(console.error);
