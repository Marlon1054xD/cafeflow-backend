jest.mock("bcryptjs", () => ({
  hash: jest.fn(),
}));

jest.mock("../../src/models/usuario.model", () => ({
  aggregate: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

const bcrypt = require("bcryptjs");
const Usuario = require("../../src/models/usuario.model");
const usuarioService = require("../../src/services/usuario.service");

describe("usuario.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normaliza datos, cifra la contraseña y devuelve solo el perfil público", async () => {
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

  test("lista usuarios ordenados y devuelve solo campos públicos", async () => {
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

  test("obtiene un usuario por id sin exponer campos privados", async () => {
    const usuario = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      nombre: "Ana",
      email: "ana@example.test",
      rol: "cliente",
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(usuario),
    };
    Usuario.findById.mockReturnValue(query);

    await expect(
      usuarioService.obtenerUsuarioPorId("507f1f77bcf86cd799439011"),
    ).resolves.toEqual({
      id: "507f1f77bcf86cd799439011",
      nombre: "Ana",
      email: "ana@example.test",
      rol: "cliente",
    });
    expect(query.select).toHaveBeenCalledWith("nombre email rol");
  });

  test("rechaza ids inválidos y devuelve 404 para usuarios inexistentes", async () => {
    await expect(
      usuarioService.obtenerUsuarioPorId("no-es-un-id"),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(Usuario.findById).not.toHaveBeenCalled();

    Usuario.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    await expect(
      usuarioService.obtenerUsuarioPorId("507f1f77bcf86cd799439011"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("resume usuarios por rol", async () => {
    Usuario.aggregate.mockResolvedValue([
      { _id: "cliente", total: 3 },
      { _id: "admin", total: 1 },
    ]);

    await expect(usuarioService.obtenerEstadisticas()).resolves.toEqual({
      total: 4,
      clientes: 3,
      administradores: 1,
    });
  });

  test("actualiza el perfil y normaliza los campos permitidos", async () => {
    const usuario = {
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      nombre: "Ana Actualizada",
      email: "ana@example.test",
      rol: "cliente",
    };
    const query = {
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(usuario),
    };
    Usuario.findByIdAndUpdate.mockReturnValue(query);

    await expect(
      usuarioService.actualizarPerfil("507f1f77bcf86cd799439011", {
        nombre: " Ana Actualizada ",
        email: " ANA@Example.Test ",
      }),
    ).resolves.toMatchObject({
      nombre: "Ana Actualizada",
      email: "ana@example.test",
      rol: "cliente",
    });
    expect(Usuario.findByIdAndUpdate).toHaveBeenCalledWith(
      "507f1f77bcf86cd799439011",
      { nombre: "Ana Actualizada", email: "ana@example.test" },
      { returnDocument: "after", runValidators: true },
    );
    expect(query.select).toHaveBeenCalledWith("nombre email rol");
  });

  test.each([
    [{}, "Solo puedes actualizar nombre y email."],
    [{ rol: "admin" }, "Solo puedes actualizar nombre y email."],
    [{ password: "no-cambiar" }, "Solo puedes actualizar nombre y email."],
    [{ nombre: " " }, "El nombre es obligatorio."],
    [{ email: "invalido" }, "El email no es válido."],
  ])("rechaza actualizaciones de perfil no permitidas: %j", async (input, message) => {
    await expect(
      usuarioService.actualizarPerfil("507f1f77bcf86cd799439011", input),
    ).rejects.toMatchObject({ statusCode: 400, message });
    expect(Usuario.findByIdAndUpdate).not.toHaveBeenCalled();
  });

  test("convierte email duplicado y usuario inexistente al actualizar", async () => {
    Usuario.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockRejectedValue(
        Object.assign(new Error("duplicate"), { code: 11000 }),
      ),
    });
    await expect(
      usuarioService.actualizarPerfil("507f1f77bcf86cd799439011", {
        email: "taken@example.test",
      }),
    ).rejects.toMatchObject({ statusCode: 409 });

    Usuario.findByIdAndUpdate.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue(null),
    });
    await expect(
      usuarioService.actualizarPerfil("507f1f77bcf86cd799439011", {
        nombre: "Ana",
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
