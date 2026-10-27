jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

const mongoose = require("mongoose");
const connectToDatabase = require("../../src/config/database");

describe("connectToDatabase", () => {
  const originalMongoUri = process.env.MONGODB_URI;
  const originalTestMongoUri = process.env.MONGODB_URI_TEST;

  beforeEach(() => {
    delete process.env.MONGODB_URI;
    delete process.env.MONGODB_URI_TEST;
    mongoose.connect.mockReset();
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
  });

  test("rechaza si falta MONGODB_URI_TEST sin intentar conectar", async () => {
    await expect(connectToDatabase()).rejects.toMatchObject({
      message: "MONGODB_URI_TEST is required.",
      code: "MONGODB_URI_TEST_MISSING",
    });
    expect(mongoose.connect).not.toHaveBeenCalled();
  });

  test("conecta usando la URI configurada", async () => {
    process.env.MONGODB_URI_TEST = "mongodb://localhost:27017/cafeflow_test";
    mongoose.connect.mockResolvedValueOnce(undefined);

    await expect(connectToDatabase()).resolves.toBeUndefined();
    expect(mongoose.connect).toHaveBeenCalledTimes(1);
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/cafeflow_test",
    );
  });

  test("propaga errores de conexión", async () => {
    process.env.MONGODB_URI_TEST = "mongodb://localhost:27017/cafeflow_test";
    const connectionError = new Error("Connection failed");
    mongoose.connect.mockRejectedValueOnce(connectionError);

    await expect(connectToDatabase()).rejects.toBe(connectionError);
  });
});
