import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Servidor local corriendo en http://127.0.0.1:${PORT}`);
});
