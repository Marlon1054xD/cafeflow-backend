const app = require("./app");

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`CaféFlow está disponible en http://localhost:${port}`);
});

server.on("error", (error) => {
  console.error(`No se pudo iniciar el servidor de CaféFlow: ${error.message}`);
  process.exitCode = 1;
});
