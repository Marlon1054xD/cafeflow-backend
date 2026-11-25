const path = require("node:path");
const { spawnSync } = require("node:child_process");

test("Supertest: flujo de catálogo, pedidos, propiedad y permisos", () => {
  const driverPath = path.join(__dirname, "catalogo-pedidos.driver.js");
  const result = spawnSync(process.execPath, [driverPath], {
    cwd: path.resolve(__dirname, "../../.."),
    env: process.env,
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${result.stdout}\n${result.stderr}`);
  }
  expect(result.stdout).toContain("API catálogo/pedidos: flujo completo aprobado.");
});
