jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

const mongoose = require("mongoose");
const connectToDatabase = require("../../src/config/database");

describe("connectToDatabase", () => {
  const originalMongoUri = process.env.MONGODB_URI;

  beforeEach(() => {
    delete process.env.MONGODB_URI;
    mongoose.connect.mockReset();
  });

  afterAll(() => {
    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }
  });

  test("rechaza si falta MONGODB_URI sin intentar conectar", async () => {
    await expect(connectToDatabase()).rejects.toMatchObject({
      message: "MONGODB_URI is required.",
      code: "MONGODB_URI_MISSING",
    });
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("conecta usando la URI configurada", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/cafeflow_test";
    mongoose.connect.mockResolvedValueOnce(undefined);

    await expect(connectToDatabase()).resolves.toBeUndefined();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/cafeflow_test",
    );
  });

  test("propaga errores de conexión", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/cafeflow_test";
    const connectionError = new Error("Connection failed");
    mongoose.connect.mockRejectedValueOnce(connectionError);

    await expect(connectToDatabase()).rejects.toBe(connectionError);
  });
});
