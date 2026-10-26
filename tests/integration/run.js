const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { validateTestMongoUri } = require("./uri-safety");

const mongoUri = process.env.MONGODB_URI_TEST;
if (!mongoUri) {
  console.error("Falta MONGODB_URI_TEST; no se ejecutarán las pruebas de integración.");
  process.exit(1);
}

try {
  validateTestMongoUri(mongoUri);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const jestPath = path.resolve(__dirname, "../../node_modules/jest/bin/jest.js");
const result = spawnSync(
  process.execPath,
  [jestPath, "--runInBand", ...process.argv.slice(2)],
  { stdio: "inherit" },
);

if (result.error) {
  console.error(`No se pudo ejecutar Jest: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
