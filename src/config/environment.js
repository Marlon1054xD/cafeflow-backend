const path = require("node:path");
const dotenv = require("dotenv");

const projectRoot = path.resolve(__dirname, "../..");
const supportedEnvironments = ["development", "test", "production"];

function loadEnvironment() {
  const nodeEnv = process.env.NODE_ENV || "development";

  if (!supportedEnvironments.includes(nodeEnv)) {
    throw new Error("NODE_ENV debe ser development, test o production.");
  }

  process.env.NODE_ENV = nodeEnv;
  const envFile = path.join(projectRoot, `.env.${nodeEnv}`);
  const result = dotenv.config({ path: envFile, override: false });

  if (result.error && result.error.code !== "ENOENT") {
    throw new Error(`No se pudo cargar el archivo .env.${nodeEnv}.`);
  }

  return nodeEnv;
}

function validateEnvironment({ requireJwt = true } = {}) {
  const requiredVariables = [
    process.env.NODE_ENV === "test" ? "MONGODB_URI_TEST" : "MONGODB_URI",
  ];

  if (requireJwt) {
    requiredVariables.push("JWT_SECRET");
  }

  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name],
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias: ${missingVariables.join(", ")}.`,
    );
  }
}

module.exports = { loadEnvironment, validateEnvironment };
