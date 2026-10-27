const fs = require("node:fs");
const path = require("node:path");
const newman = require("newman");

const root = path.resolve(__dirname, "..");
const collectionPath = path.join(
  root,
  "tests",
  "api",
  "cafeflow.postman_collection.json",
);
const environmentPath = path.resolve(
  root,
  process.env.POSTMAN_ENVIRONMENT ||
    path.join("postman", "CafeFlow.postman_environment.json"),
);
const baseUrl = process.env.API_BASE_URL || "http://localhost:3000";
const maxResponseTimeMs = Number(process.env.MAX_RESPONSE_TIME_MS || 2000);

function countEnabledRequests(items) {
  return items.reduce((total, item) => {
    if (item.disabled) {
      return total;
    }

    if (Array.isArray(item.item)) {
      return total + countEnabledRequests(item.item);
    }

    return total + (item.request ? 1 : 0);
  }, 0);
}

function setEnvironmentValue(environment, key, value) {
  const variable = (environment.values || []).find(
    (entry) => entry.key === key,
  );

  if (variable) {
    variable.value = value;
    variable.enabled = true;
    return;
  }

  environment.values = environment.values || [];
  environment.values.push({ key, value, enabled: true });
}

if (!Number.isFinite(maxResponseTimeMs) || maxResponseTimeMs <= 0) {
  throw new Error("MAX_RESPONSE_TIME_MS debe ser un número mayor que cero.");
}

const collection = JSON.parse(fs.readFileSync(collectionPath, "utf8"));
const environment = JSON.parse(fs.readFileSync(environmentPath, "utf8"));

if (countEnabledRequests(collection.item || []) === 0) {
  console.error(
    "Pruebas API pendientes: no hay solicitudes habilitadas; la aplicación todavía no implementa endpoints.",
  );
  process.exitCode = 2;
} else {
  setEnvironmentValue(environment, "baseUrl", baseUrl);
  setEnvironmentValue(
    environment,
    "maxResponseTimeMs",
    String(maxResponseTimeMs),
  );

  newman.run(
    { collection, environment, reporters: ["cli"] },
    (error, summary) => {
      if (error) {
        console.error("Newman no pudo ejecutar la colección:", error.message);
        process.exitCode = 1;
      } else if (summary.run.failures.length > 0) {
        process.exitCode = 1;
      }
    },
  );
}
