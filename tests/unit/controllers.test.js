jest.mock("../../src/services/auth.service", () => ({
  iniciarSesion: jest.fn(),
  registrarUsuario: jest.fn(),
}));

jest.mock("../../src/services/usuario.service", () => ({
  actualizarPerfil: jest.fn(),
  listarUsuarios: jest.fn(),
  obtenerEstadisticas: jest.fn(),
  obtenerUsuarioPorId: jest.fn(),
}));

const authService = require("../../src/services/auth.service");
const usuarioService = require("../../src/services/usuario.service");
const authController = require("../../src/controllers/auth.controller");
const usuariosController = require("../../src/controllers/usuarios.controller");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("controllers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("registra un usuario y responde HTTP 201 con el perfil público", async () => {
    const body = {
      nombre: "Karen",
      email: "karen@example.test",
      password: "clave-segura",
    };
    const user = {
      id: "user-1",
      nombre: "Karen",
      email: "karen@example.test",
      rol: "cliente",
    };
    const res = createResponse();
    authService.registrarUsuario.mockResolvedValue(user);

    await authController.registrar({ body }, res);

    expect(authService.registrarUsuario).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user });
  });

  test("inicia sesión y responde HTTP 200 con el resultado del servicio", async () => {
    const body = { email: "karen@example.test", password: "clave-segura" };
    const result = {
      access_token: "unit-test-token",
      user: {
        id: "user-1",
        nombre: "Karen",
        email: "karen@example.test",
        rol: "cliente",
      },
    };
    const res = createResponse();
    authService.iniciarSesion.mockResolvedValue(result);

    await authController.iniciarSesion({ body }, res);

    expect(authService.iniciarSesion).toHaveBeenCalledWith(body);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(result);
  });

  test("devuelve el perfil adjunto por el middleware de autenticación", () => {
    const user = { id: "user-1", rol: "cliente" };
    const res = createResponse();

    usuariosController.obtenerPerfil({ user }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user });
  });

  test("lista usuarios usando el servicio y responde HTTP 200", async () => {
    const users = [{ id: "user-1", rol: "admin" }];
    const res = createResponse();
    usuarioService.listarUsuarios.mockResolvedValue(users);

    await usuariosController.listar({}, res);

    expect(usuarioService.listarUsuarios).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ users });
  });

  test("obtiene un usuario por id usando el servicio", async () => {
    const user = { id: "user-1", rol: "cliente" };
    const res = createResponse();
    usuarioService.obtenerUsuarioPorId.mockResolvedValue(user);

    await usuariosController.obtenerPorId({ params: { id: "user-1" } }, res);

    expect(usuarioService.obtenerUsuarioPorId).toHaveBeenCalledWith("user-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user });
  });

  test("devuelve estadísticas mediante el servicio", async () => {
    const statistics = { total: 1, clientes: 1, administradores: 0 };
    const res = createResponse();
    usuarioService.obtenerEstadisticas.mockResolvedValue(statistics);

    await usuariosController.obtenerEstadisticas({}, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ statistics });
  });

  test("actualiza el perfil del usuario autenticado", async () => {
    const user = { id: "user-1", nombre: "Ana" };
    const req = { user: { id: "user-1" }, body: { nombre: "Ana" } };
    const res = createResponse();
    usuarioService.actualizarPerfil.mockResolvedValue(user);

    await usuariosController.actualizarPerfil(req, res);

    expect(usuarioService.actualizarPerfil).toHaveBeenCalledWith(
      "user-1",
      req.body,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ user });
  });
});
