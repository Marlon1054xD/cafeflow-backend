const {
  loadEnvironment,
  validateEnvironment,
} = require("../../src/config/environment");

const variableNames = [
  "NODE_ENV",
  "MONGODB_URI",
  "MONGODB_URI_TEST",
  "JWT_SECRET",
];
let originalEnvironment;

describe("environment configuration", () => {
  beforeEach(() => {
    originalEnvironment = Object.fromEntries(
      variableNames.map((name) => [name, process.env[name]]),
    );
    for (const name of variableNames) {
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of variableNames) {
      if (originalEnvironment[name] === undefined) {
        delete process.env[name];
      } else {
        process.env[name] = originalEnvironment[name];
      }
    }
  });

  it("loads test mode while preserving values already provided by CI", () => {
    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI_TEST = "mongodb://ci/cafeflow_test";
    process.env.JWT_SECRET = "ci-only-test-secret";

    expect(loadEnvironment()).toBe("test");
    expect(process.env.MONGODB_URI_TEST).toBe(
      "mongodb://ci/cafeflow_test",
    );
    expect(process.env.JWT_SECRET).toBe("ci-only-test-secret");
    expect(() => validateEnvironment()).not.toThrow();
  });

  it("requires only the test database variable in test mode", () => {
    process.env.NODE_ENV = "test";
    process.env.MONGODB_URI = "mongodb://localhost/cafeflow";
    process.env.JWT_SECRET = "test-secret";

    expect(() => validateEnvironment()).toThrow("MONGODB_URI_TEST");
    expect(() => validateEnvironment()).not.toThrow("mongodb://localhost");
  });

  it("requires the regular database URI outside test mode", () => {
    process.env.NODE_ENV = "production";
    process.env.MONGODB_URI_TEST = "mongodb://localhost/cafeflow_test";
    process.env.JWT_SECRET = "test-secret";

    expect(() => validateEnvironment()).toThrow("MONGODB_URI");
    expect(() => validateEnvironment()).not.toThrow("cafeflow_test");
  });

  it("rejects unsupported NODE_ENV values", () => {
    process.env.NODE_ENV = "staging";

    expect(() => loadEnvironment()).toThrow(
      "NODE_ENV debe ser development, test o production.",
    );
  });
});
