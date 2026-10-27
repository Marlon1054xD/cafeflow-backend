const { autorizarRoles } = require("../../src/middlewares/role.middleware");

describe("autorizarRoles", () => {
  let res;
  let next;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  it("responde 401 cuando la solicitud no tiene usuario autenticado", () => {
    const middleware = autorizarRoles("admin");

    middleware({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Autenticación requerida o inválida.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 cuando el rol del usuario no está autorizado", () => {
    const middleware = autorizarRoles("admin");

    middleware({ user: { rol: "cliente" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "No tienes permisos para este recurso.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("continúa cuando el rol del usuario está autorizado", () => {
    const middleware = autorizarRoles("admin");

    middleware({ user: { rol: "admin" } }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
