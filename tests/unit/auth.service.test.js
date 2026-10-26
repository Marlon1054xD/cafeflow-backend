jest.mock("../../src/models/usuario.model", () => ({
  findOne: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
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

describe("authService", () => {
  const usuario = {
    _id: { toString: () => "user-id" },
    nombre: "Esteban",
    email: "esteban@example.test",
    rol: "cliente",
    password: "hashed-password",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "unit-test-secret";
    process.env.JWT_EXPIRES_IN = "30m";
    usuarioService.toPublicUser.mockReturnValue({
      id: "user-id",
      nombre: "Esteban",
      email: "esteban@example.test",
      rol: "cliente",
    });
  });

  afterEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_EXPIRES_IN;
  });

  it("forces public registrations to use the cliente role", async () => {
    usuarioService.crearUsuario.mockResolvedValue({ id: "user-id" });

    await authService.registrarUsuario({
      nombre: "Esteban",
      email: "esteban@example.test",
      password: "a-secure-password",
      rol: "admin",
    });

    expect(usuarioService.crearUsuario).toHaveBeenCalledWith({
      nombre: "Esteban",
      email: "esteban@example.test",
      password: "a-secure-password",
      rol: "cliente",
    });
  });

  it("returns a signed token and a public profile after valid login", async () => {
    const select = jest.fn().mockResolvedValue(usuario);
    Usuario.findOne.mockReturnValue({ select });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue("signed-test-token");

    const result = await authService.iniciarSesion({
      email: " ESTEBAN@EXAMPLE.TEST ",
      password: "a-secure-password",
    });

    expect(Usuario.findOne).toHaveBeenCalledWith({
      email: "esteban@example.test",
    });
    expect(select).toHaveBeenCalledWith("+password");
    expect(jwt.sign).toHaveBeenCalledWith(
      { rol: "cliente" },
      "unit-test-secret",
      { subject: "user-id", expiresIn: "30m" },
    );
    expect(result).toEqual({
      access_token: "signed-test-token",
      user: {
        id: "user-id",
        nombre: "Esteban",
        email: "esteban@example.test",
        rol: "cliente",
      },
    });
  });

  it.each([
    [{ email: null, password: "password" }, 400],
    [{ email: "invalid", password: "password" }, 401],
  ])("rejects invalid login input", async (credentials, statusCode) => {
    await expect(authService.iniciarSesion(credentials)).rejects.toMatchObject({
      statusCode,
    });
    expect(Usuario.findOne).not.toHaveBeenCalled();
  });

  it("rejects a wrong password with a generic error", async () => {
    const select = jest.fn().mockResolvedValue(usuario);
    Usuario.findOne.mockReturnValue({ select });
    bcrypt.compare.mockResolvedValue(false);

    await expect(
      authService.iniciarSesion({
        email: "esteban@example.test",
        password: "wrong-password",
      }),
    ).rejects.toMatchObject({
      statusCode: 401,
      message: "Email o contraseña incorrectos.",
    });
  });

  it("rejects valid credentials when JWT configuration is missing", async () => {
    delete process.env.JWT_SECRET;
    const select = jest.fn().mockResolvedValue(usuario);
    Usuario.findOne.mockReturnValue({ select });
    bcrypt.compare.mockResolvedValue(true);

    await expect(
      authService.iniciarSesion({
        email: "esteban@example.test",
        password: "a-secure-password",
      }),
    ).rejects.toMatchObject({
      statusCode: 500,
      message: "La autenticación no está configurada.",
    });
  });
});
