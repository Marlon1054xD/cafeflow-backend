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

  it("returns 401 when authentication is missing", () => {
    const middleware = autorizarRoles("admin");

    middleware({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Autenticación requerida o inválida.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when the user role is not allowed", () => {
    const middleware = autorizarRoles("admin");

    middleware({ user: { rol: "cliente" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "No tienes permisos para este recurso.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("continues when the user has an allowed role", () => {
    const middleware = autorizarRoles("admin");

    middleware({ user: { rol: "admin" } }, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
