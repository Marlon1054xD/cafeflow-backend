const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { validateTestMongoUri } = require("./uri-safety");
const {
  loadEnvironment,
  validateEnvironment,
} = require("../../src/config/environment");

process.env.NODE_ENV = "test";

try {
  loadEnvironment();
  validateEnvironment();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI_TEST;

try {
  validateTestMongoUri(mongoUri);
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const jestPath = path.resolve(__dirname, "../../node_modules/jest/bin/jest.js");
const jestResult = spawnSync(
  process.execPath,
  [
    jestPath,
    "--runInBand",
    "tests/integration/top-down/salud.test.js",
    "tests/integration/uri-safety.test.js",
    ...process.argv.slice(2),
  ],
  { stdio: "inherit" },
);

if (jestResult.error) {
  console.error(`No se pudo ejecutar Jest: ${jestResult.error.message}`);
  process.exit(1);
}

if (jestResult.status !== 0) {
  process.exit(jestResult.status ?? 1);
}

const databaseResult = spawnSync(
  process.execPath,
  [path.resolve(__dirname, "auth.integration.js")],
  { stdio: "inherit" },
);

if (databaseResult.error) {
  console.error(
    `No se pudieron ejecutar las pruebas contra MongoDB: ${databaseResult.error.message}`,
  );
  process.exit(1);
}

process.exit(databaseResult.status ?? 1);
