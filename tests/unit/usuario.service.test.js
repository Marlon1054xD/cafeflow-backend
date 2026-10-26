jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("../../src/models/usuario.model", () => ({
  create: jest.fn(),
  find: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const Usuario = require("../../src/models/usuario.model");
const usuarioService = require("../../src/services/usuario.service");

describe("usuario.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normaliza los datos, cifra contraseña y devuelve solo el perfil público", async () => {
    bcrypt.hash.mockResolvedValue("hash-simulado");
    Usuario.create.mockResolvedValue({
      _id: { toString: () => "user-123" },
      nombre: "Karen",
      email: "karen@example.test",
      rol: "cliente",
      password: "hash-simulado",
    });

    await expect(
      usuarioService.crearUsuario({
        nombre: " Karen ",
        email: " KAREN@Example.Test ",
        password: "clave-segura",
        rol: "cliente",
      }),
    ).resolves.toEqual({
      id: "user-123",
      nombre: "Karen",
      email: "karen@example.test",
      rol: "cliente",
    });

    expect(bcrypt.hash).toHaveBeenCalledWith("clave-segura", 12);
    expect(Usuario.create).toHaveBeenCalledWith({
      nombre: "Karen",
      email: "karen@example.test",
      password: "hash-simulado",
      rol: "cliente",
    });
  });

  test("convierte el error de índice único en HTTP 409", async () => {
    bcrypt.hash.mockResolvedValue("hash-simulado");
    Usuario.create.mockRejectedValue(
      Object.assign(new Error("duplicate"), { code: 11000 }),
    );

    await expect(
      usuarioService.crearUsuario({
        nombre: "Karen",
        email: "karen@example.test",
        password: "clave-segura",
        rol: "cliente",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Ya existe una cuenta con ese email.",
    });
  });

  test.each([
    [
      { nombre: " ", email: "karen@example.test", password: "clave-segura", rol: "cliente" },
      400,
      "El nombre es obligatorio.",
    ],
    [
      { nombre: "Karen", email: "invalido", password: "clave-segura", rol: "cliente" },
      400,
      "El email no es válido.",
    ],
    [
      { nombre: "Karen", email: "karen@example.test", password: "short", rol: "cliente" },
      400,
      "La contraseña debe tener al menos 8 caracteres.",
    ],
    [
      { nombre: "Karen", email: "karen@example.test", password: "clave-segura", rol: "superadmin" },
      400,
      "El rol no es válido.",
    ],
  ])("rechaza datos de registro inválidos", async (input, statusCode, message) => {
    await expect(usuarioService.crearUsuario(input)).rejects.toMatchObject({
      statusCode,
      message,
    });
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(Usuario.create).not.toHaveBeenCalled();
  });

  test("propaga errores de almacenamiento distintos de duplicados", async () => {
    const databaseError = new Error("storage unavailable");
    bcrypt.hash.mockResolvedValue("hash-simulado");
    Usuario.create.mockRejectedValue(databaseError);

    await expect(
      usuarioService.crearUsuario({
        nombre: "Karen",
        email: "karen@example.test",
        password: "clave-segura",
        rol: "cliente",
      }),
    ).rejects.toBe(databaseError);
  });

  test("lista usuarios ordenados y solo devuelve campos públicos", async () => {
    const users = [
      {
        _id: { toString: () => "user-1" },
        nombre: "Ana",
        email: "ana@example.test",
        rol: "cliente",
        password: "no-publicar",
      },
    ];
    const query = {
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(users),
    };
    Usuario.find.mockReturnValue(query);

    await expect(usuarioService.listarUsuarios()).resolves.toEqual([
      {
        id: "user-1",
        nombre: "Ana",
        email: "ana@example.test",
        rol: "cliente",
      },
    ]);

    expect(query.select).toHaveBeenCalledWith("nombre email rol");
    expect(query.sort).toHaveBeenCalledWith({ _id: 1 });
    expect(query.lean).toHaveBeenCalledTimes(1);
  });
});
