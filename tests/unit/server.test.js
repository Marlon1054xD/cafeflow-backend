jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("../../src/config/environment", () => ({
  loadEnvironment: jest.fn(),
  validateEnvironment: jest.fn(),
}));

jest.mock("../../src/app", () => ({
  listen: jest.fn(),
}));

jest.mock("../../src/config/database", () => jest.fn());

const app = require("../../src/app");
const connectToDatabase = require("../../src/config/database");
const startServer = require("../../src/server");

describe("startServer", () => {
  const originalMongoUri = process.env.MONGODB_URI;
  const originalTestMongoUri = process.env.MONGODB_URI_TEST;
  const originalPort = process.env.PORT;
  const exitError = new Error("process.exit llamado en la prueba");
  let mockServer;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_URI_TEST;
    delete process.env.PORT;
    process.exitCode = 0;
    mockServer = { on: jest.fn() };
    app.listen.mockReturnValue(mockServer);
    jest.spyOn(process, "exit").mockImplementation(() => {
      throw exitError;
    });
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.exitCode = 0;
  });

  afterAll(() => {
    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }
    if (originalTestMongoUri === undefined) {
      delete process.env.MONGODB_URI_TEST;
    } else {
      process.env.MONGODB_URI_TEST = originalTestMongoUri;
    }

    if (originalPort === undefined) {
      delete process.env.PORT;
    } else {
      process.env.PORT = originalPort;
    }
  });

  test("conecta e inicia la escucha en el puerto configurado", async () => {
    process.env.MONGODB_URI_TEST = "mongodb://example.test/cafeflow_test";
    process.env.PORT = "4321";
    connectToDatabase.mockResolvedValueOnce(undefined);
    app.listen.mockImplementationOnce((_port, onListening) => {
      onListening();
      return mockServer;
    });

    await expect(startServer()).resolves.toBeUndefined();

    expect(connectToDatabase).toHaveBeenCalledTimes(1);
    expect(app.listen).toHaveBeenCalledWith(
      "4321",
      expect.any(Function),
    );
    expect(console.log).toHaveBeenCalledWith(
      "CaféFlow está disponible en http://localhost:4321",
    );
    expect(mockServer.on).toHaveBeenCalledWith("error", expect.any(Function));
  });

  test("no inicia la escucha si falta MONGODB_URI", async () => {
    connectToDatabase.mockRejectedValueOnce(
      Object.assign(new Error("MONGODB_URI_TEST is required."), {
        code: "MONGODB_URI_TEST_MISSING",
      }),
    );

    await expect(startServer()).rejects.toBe(exitError);
    expect(console.error).toHaveBeenCalledWith(
      "No se pudo iniciar CaféFlow: falta configurar MONGODB_URI_TEST.",
    );
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(app.listen).not.toHaveBeenCalled();
  });

  test("no inicia la escucha cuando falla la conexión", async () => {
    connectToDatabase.mockRejectedValueOnce(new Error("Connection failed"));

    await expect(startServer()).rejects.toBe(exitError);
    expect(console.error).toHaveBeenCalledWith(
      "No se pudo iniciar CaféFlow: falló la conexión con MongoDB.",
    );
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(app.listen).not.toHaveBeenCalled();
  });

  test("marca error de proceso cuando falla el servidor HTTP", async () => {
    process.env.MONGODB_URI_TEST = "mongodb://example.test/cafeflow_test";
    connectToDatabase.mockResolvedValueOnce(undefined);
    await startServer();

    const errorHandler = mockServer.on.mock.calls.find(
      ([eventName]) => eventName === "error",
    )[1];
    errorHandler(new Error("Listen failed"));

    expect(console.error).toHaveBeenCalledWith(
      "No se pudo iniciar el servidor de CaféFlow.",
    );
    expect(process.exitCode).toBe(1);
    expect(process.exit).not.toHaveBeenCalled();
  });
});
