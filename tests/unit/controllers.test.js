jest.mock("../../src/services/auth.service", () => ({
  iniciarSesion: jest.fn(),
  registrarUsuario: jest.fn(),
}));

jest.mock("../../src/services/usuario.service", () => ({
  listarUsuarios: jest.fn(),
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
});
