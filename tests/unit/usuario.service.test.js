jest.mock("../../src/models/usuario.model", () => ({
  create: jest.fn(),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const Usuario = require("../../src/models/usuario.model");
const usuarioService = require("../../src/services/usuario.service");

describe("usuarioService.crearUsuario", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue("hashed-password");
  });

  it("normalizes the email and returns only public user fields", async () => {
    Usuario.create.mockResolvedValue({
      _id: { toString: () => "user-id" },
      nombre: "Esteban",
      email: "esteban@example.test",
      rol: "cliente",
      password: "hashed-password",
    });

    const user = await usuarioService.crearUsuario({
      nombre: " Esteban ",
      email: " ESTEBAN@EXAMPLE.TEST ",
      password: "a-secure-password",
      rol: "cliente",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("a-secure-password", 12);
    expect(Usuario.create).toHaveBeenCalledWith({
      nombre: "Esteban",
      email: "esteban@example.test",
      password: "hashed-password",
      rol: "cliente",
    });
    expect(user).toEqual({
      id: "user-id",
      nombre: "Esteban",
      email: "esteban@example.test",
      rol: "cliente",
    });
    expect(user).not.toHaveProperty("password");
  });

  it.each([
    [{ nombre: " ", email: "user@example.test", password: "12345678", rol: "cliente" }],
    [{ nombre: "Name", email: "invalid", password: "12345678", rol: "cliente" }],
    [{ nombre: "Name", email: "user@example.test", password: "short", rol: "cliente" }],
    [{ nombre: "Name", email: "user@example.test", password: "12345678", rol: "owner" }],
  ])("rejects invalid user data", async (input) => {
    await expect(usuarioService.crearUsuario(input)).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(Usuario.create).not.toHaveBeenCalled();
  });

  it("converts MongoDB duplicate-key errors into a conflict", async () => {
    Usuario.create.mockRejectedValue({ code: 11000 });

    await expect(
      usuarioService.crearUsuario({
        nombre: "Name",
        email: "user@example.test",
        password: "a-secure-password",
        rol: "cliente",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Ya existe una cuenta con ese email.",
    });
  });

  it("propagates unexpected database errors", async () => {
    const databaseError = new Error("database unavailable");
    Usuario.create.mockRejectedValue(databaseError);

    await expect(
      usuarioService.crearUsuario({
        nombre: "Name",
        email: "user@example.test",
        password: "a-secure-password",
        rol: "cliente",
      }),
    ).rejects.toBe(databaseError);
  });
});
