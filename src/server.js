const {
  loadEnvironment,
  validateEnvironment,
} = require("./config/environment");

try {
  loadEnvironment();
  validateEnvironment();
} catch (error) {
  console.error(`Configuración inválida: ${error.message}`);
  process.exit(1);
}

const app = require("./app");
const connectToDatabase = require("./config/database");

async function startServer() {
  try {
    await connectToDatabase();
  } catch (error) {
    if (
      error.code === "MONGODB_URI_MISSING" ||
      error.code === "MONGODB_URI_TEST_MISSING"
    ) {
      const variableName =
        error.code === "MONGODB_URI_TEST_MISSING"
          ? "MONGODB_URI_TEST"
          : "MONGODB_URI";
      console.error(
        `No se pudo iniciar CaféFlow: falta configurar ${variableName}.`,
      );
    } else {
      console.error(
        "No se pudo iniciar CaféFlow: falló la conexión con MongoDB.",
      );
    }
    process.exit(1);
  }

  const port = process.env.PORT || 3000;
  const server = app.listen(port, () => {
    console.log(`CaféFlow está disponible en http://localhost:${port}`);
  });

  server.on("error", () => {
    console.error("No se pudo iniciar el servidor de CaféFlow.");
    process.exitCode = 1;
  });
}

startServer();
