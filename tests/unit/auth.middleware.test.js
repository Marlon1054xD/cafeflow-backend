jest.mock("jsonwebtoken", () => {
  class JsonWebTokenError extends Error {}
  class TokenExpiredError extends JsonWebTokenError {}

  return {
    JsonWebTokenError,
    TokenExpiredError,
    verify: jest.fn(),
  };
});

jest.mock("mongoose", () => ({
  isValidObjectId: jest.fn(),
}));

jest.mock("../../src/models/usuario.model", () => ({
  findById: jest.fn(),
}));

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Usuario = require("../../src/models/usuario.model");
const { autenticar } = require("../../src/middlewares/auth.middleware");

describe("auth.middleware", () => {
  const originalSecret = process.env.JWT_SECRET;
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    req = {
      get: jest.fn().mockReturnValue("Bearer token-simulado"),
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  test.each(["", "Basic token", "Bearer", "Bearer token extra"])(
    "rechaza encabezado de autorización ausente o inválido: %s",
    async (authorization) => {
      req.get.mockReturnValue(authorization);

      await autenticar(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: "Autenticación requerida o inválida.",
      });
      expect(jwt.verify).not.toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    },
  );

  test("pasa error 500 al manejador si falta JWT_SECRET", async () => {
    delete process.env.JWT_SECRET;

    await autenticar(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: "La autenticación no está configurada.",
      }),
    );
    expect(jwt.verify).not.toHaveBeenCalled();
  });

  test("responde 401 cuando JWT es inválido", async () => {
    jwt.verify.mockImplementation(() => {
      throw new jwt.JsonWebTokenError("invalid token");
    });

    await autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Autenticación requerida o inválida.",
    });
    expect(Usuario.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("responde 401 cuando JWT expiró", async () => {
    jwt.verify.mockImplementation(() => {
      throw new jwt.TokenExpiredError("jwt expired");
    });

    await autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Autenticación requerida o inválida.",
    });
    expect(Usuario.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("pasa errores inesperados de JWT al manejador de errores", async () => {
    const verifyError = new Error("unexpected verification failure");
    jwt.verify.mockImplementation(() => {
      throw verifyError;
    });

    await autenticar(req, res, next);

    expect(next).toHaveBeenCalledWith(verifyError);
    expect(res.status).not.toHaveBeenCalled();
  });

  test.each([
    null,
    {},
    { sub: 123 },
    { sub: "invalid-id" },
  ])("rechaza payloads sin un subject ObjectId válido", async (payload) => {
    jwt.verify.mockReturnValue(payload);
    mongoose.isValidObjectId.mockReturnValue(false);

    await autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(Usuario.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  test("rechaza una identidad que ya no existe", async () => {
    jwt.verify.mockReturnValue({ sub: "507f1f77bcf86cd799439011" });
    mongoose.isValidObjectId.mockReturnValue(true);
    Usuario.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await autenticar(req, res, next);

    expect(Usuario.findById).toHaveBeenCalledWith("507f1f77bcf86cd799439011");
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("adjunta el perfil público y continúa con un JWT válido", async () => {
    const usuario = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      nombre: "Ana",
      email: "ana@example.test",
      rol: "cliente",
      password: "no-se-incluye",
    };
    const query = { select: jest.fn().mockResolvedValue(usuario) };
    jwt.verify.mockReturnValue({ sub: "507f1f77bcf86cd799439011" });
    mongoose.isValidObjectId.mockReturnValue(true);
    Usuario.findById.mockReturnValue(query);

    await autenticar(req, res, next);

    expect(query.select).toHaveBeenCalledWith("nombre email rol");
    expect(req.user).toEqual({
      id: "507f1f77bcf86cd799439011",
      nombre: "Ana",
      email: "ana@example.test",
      rol: "cliente",
    });
    expect(req.user).not.toHaveProperty("password");
    expect(next).toHaveBeenCalledWith();
  });

  test("pasa fallos de consulta del usuario al manejador", async () => {
    const queryError = new Error("user query failed");
    jwt.verify.mockReturnValue({ sub: "507f1f77bcf86cd799439011" });
    mongoose.isValidObjectId.mockReturnValue(true);
    Usuario.findById.mockReturnValue({
      select: jest.fn().mockRejectedValue(queryError),
    });

    await expect(autenticar(req, res, next)).rejects.toBe(queryError);
  });
});
