const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { prepareFixtures, removeFixtures } = require("./fixtures");

const root = path.resolve(__dirname, "../..");
const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000";
const frontendBaseUrl =
  process.env.FRONTEND_BASE_URL || "http://localhost:5173";

function validateBaseUrl(value, name) {
  const parsed = new URL(value);
  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== "/" ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      `${name} debe ser una URL HTTP(S) de origen, sin credenciales ni ruta.`,
    );
  }
  return parsed.origin;
}

async function requireOk(url, name) {
  let response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  } catch (error) {
    throw new Error(`${name} no disponible en ${url}: ${error.message}`);
  }
  if (!response.ok) {
    throw new Error(`${name} respondió HTTP ${response.status} en ${url}.`);
  }
}

async function verifyServices() {
  const apiOrigin = validateBaseUrl(apiBaseUrl, "API_BASE_URL");
  const frontendOrigin = validateBaseUrl(
    frontendBaseUrl,
    "FRONTEND_BASE_URL",
  );

  await requireOk(`${apiOrigin}/api/salud`, "La API");
  await requireOk(frontendOrigin, "El frontend");

  let preflight;
  try {
    preflight = await fetch(`${apiOrigin}/api/pedidos`, {
      method: "OPTIONS",
      headers: {
        Origin: frontendOrigin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    throw new Error(
      `No se pudo comprobar CORS de la API ${apiOrigin}: ${error.message}`,
    );
  }
  if (
    preflight.status !== 204 ||
    preflight.headers.get("access-control-allow-origin") !== frontendOrigin
  ) {
    throw new Error(
      `CORS no permite el origen del frontend ${frontendOrigin}; revisa CORS_ORIGINS.`,
    );
  }

  return { apiOrigin, frontendOrigin };
}

async function run() {
  process.env.NODE_ENV = "test";
  const { apiOrigin, frontendOrigin } = await verifyServices();
  let fixture;
  let testStatus = 1;

  try {
    fixture = await prepareFixtures();
    const testFiles = [
      path.join(__dirname, "login.e2e.test.js"),
      path.join(__dirname, "pedido.e2e.test.js"),
    ];
    const testEnvironment = {
      ...process.env,
      API_BASE_URL: apiOrigin,
      FRONTEND_BASE_URL: frontendOrigin,
      E2E_BEER_ID: fixture.beerId,
      E2E_BEER_NAME: fixture.beerName,
      E2E_USER_EMAIL: fixture.email,
      E2E_USER_PASSWORD: fixture.password,
      E2E_USER_PASSWORD_INCORRECT: `${fixture.password}-incorrecta`,
      E2E_EVIDENCE_DIR: path.join(root, "reports", "e2e"),
    };

    const result = spawnSync(
      process.execPath,
      ["--test", "--test-concurrency=1", ...testFiles],
      { cwd: root, env: testEnvironment, stdio: "inherit" },
    );

    if (result.error) {
      throw new Error(
        `No se pudo iniciar Node/Selenium: ${result.error.message}`,
      );
    }
    testStatus = result.status ?? 1;
  } finally {
    if (fixture) {
      await removeFixtures(fixture);
      console.log("Fixtures E2E eliminados de la base aislada.");
    }
  }

  process.exitCode = testStatus;
}

run().catch((error) => {
  console.error(`No se pudo completar Selenium E2E: ${error.message}`);
  process.exitCode = 1;
});
