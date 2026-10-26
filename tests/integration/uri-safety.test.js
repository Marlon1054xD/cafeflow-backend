const { validateTestMongoUri } = require("./uri-safety");

describe("validación segura de MONGODB_URI_TEST", () => {
  it("acepta una URI que identifica una base de pruebas", () => {
    expect(
      validateTestMongoUri("mongodb://127.0.0.1:27017/cafeflow_test"),
    ).toBe("cafeflow_test");
  });

  it.each([
    ["URI inválida", "no-es-una-uri"],
    ["protocolo no MongoDB", "https://example.test/cafeflow_test"],
    ["sin nombre de base", "mongodb://127.0.0.1:27017"],
    ["base sin marca de pruebas", "mongodb://127.0.0.1:27017/cafeflow"],
    [
      "opción dbName que cambia a una base no aislada",
      "mongodb://127.0.0.1:27017/cafeflow_test?dbName=cafeflow",
    ],
  ])("rechaza %s", (_description, uri) => {
    expect(() => validateTestMongoUri(uri)).toThrow();
  });
});
