jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("../../src/models/usuario.model", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../src/services/usuario.service", () => ({
  crearUsuario: jest.fn(),
  toPublicUser: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../../src/models/usuario.model");
const usuarioService = require("../../src/services/usuario.service");
const authService = require("../../src/services/auth.service");

describe("auth.service", () => {
  const originalSecret = process.env.JWT_SECRET;
  const originalExpiresIn = process.env.JWT_EXPIRES_IN;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    delete process.env.JWT_EXPIRES_IN;
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;

    if (originalExpiresIn === undefined) delete process.env.JWT_EXPIRES_IN;
    else process.env.JWT_EXPIRES_IN = originalExpiresIn;
  });

  test("registra con rol cliente delegando el hash al servicio de usuario", async () => {
    const publicUser = { id: "user-1", nombre: "Ana", rol: "cliente" };
    usuarioService.crearUsuario.mockResolvedValue(publicUser);

    await expect(
      authService.registrarUsuario({
        nombre: "Ana",
        email: "ana@example.test",
        password: "clave-segura",
      }),
    ).resolves.toBe(publicUser);

    expect(usuarioService.crearUsuario).toHaveBeenCalledWith({
      nombre: "Ana",
      email: "ana@example.test",
      password: "clave-segura",
      rol: "cliente",
    });
  });

  test("inicia sesión con credenciales válidas y devuelve un JWT y perfil público", async () => {
    const usuario = {
      _id: { toString: () => "user-1" },
      nombre: "Ana",
      email: "ana@example.test",
      rol: "cliente",
      password: "hash-almacenado",
    };
    const query = { select: jest.fn().mockResolvedValue(usuario) };
    Usuario.findOne.mockReturnValue(query);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("jwt-simulado");
    usuarioService.toPublicUser.mockReturnValue({
      id: "user-1",
      nombre: "Ana",
      email: "ana@example.test",
      rol: "cliente",
    });
    process.env.JWT_EXPIRES_IN = "30m";

    await expect(
      authService.iniciarSesion({
        email: " ANA@Example.Test ",
        password: "clave-segura",
      }),
    ).resolves.toEqual({
      access_token: "jwt-simulado",
      user: {
        id: "user-1",
        nombre: "Ana",
        email: "ana@example.test",
        rol: "cliente",
      },
    });

    expect(Usuario.findOne).toHaveBeenCalledWith({
      email: "ana@example.test",
    });
    expect(query.select).toHaveBeenCalledWith("+password");
    expect(bcrypt.compare).toHaveBeenCalledWith(
      "clave-segura",
      "hash-almacenado",
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      { rol: "cliente" },
      "test-secret",
      { subject: "user-1", expiresIn: "30m" },
    );
  });

  test.each([
    [{ email: undefined, password: "clave-segura" }, 400],
    [{ email: "ana@example.test", password: "" }, 400],
    [{ email: "email-invalido", password: "clave-segura" }, 401],
  ])("rechaza credenciales ausentes o con email inválido", async (credentials, statusCode) => {
    await expect(authService.iniciarSesion(credentials)).rejects.toMatchObject({
      statusCode,
    });
    expect(Usuario.findOne).not.toHaveBeenCalled();
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test("rechaza el login cuando no existe el usuario", async () => {
    Usuario.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await expect(
      authService.iniciarSesion({
        email: "ana@example.test",
        password: "clave-segura",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Email o contraseña incorrectos.",
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  test("rechaza el login si bcrypt indica contraseña incorrecta", async () => {
    Usuario.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ password: "hash-almacenado" }),
    });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.iniciarSesion({
        email: "ana@example.test",
        password: "otra-clave",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Email o contraseña incorrectos.",
    });
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  test("falla explícitamente si JWT_SECRET no está configurado", async () => {
    delete process.env.JWT_SECRET;
    Usuario.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue({ password: "hash-almacenado" }),
    });
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      authService.iniciarSesion({
        email: "ana@example.test",
        password: "clave-segura",
      }),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "La autenticación no está configurada.",
    });
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  test("propaga fallos al consultar el modelo", async () => {
    const databaseError = new Error("query failed");
    Usuario.findOne.mockReturnValue({
      select: jest.fn().mockRejectedValue(databaseError),
    });

    await expect(
      authService.iniciarSesion({
        email: "ana@example.test",
        password: "clave-segura",
      }),
    ).rejects.toBe(databaseError);
  });
});
