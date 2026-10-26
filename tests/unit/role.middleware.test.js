const { autorizarRoles } = require("../../src/middlewares/role.middleware");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("role.middleware", () => {
  test("responde 401 cuando la ruta de roles recibe una solicitud sin usuario", () => {
    const res = createResponse();
    const next = jest.fn();

    autorizarRoles("admin")({}, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "Autenticación requerida o inválida.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("rechaza a un cliente en una ruta exclusiva de admin con 403", () => {
    const res = createResponse();
    const next = jest.fn();

    autorizarRoles("admin")({ user: { rol: "cliente" } }, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "No tienes permisos para este recurso.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("permite a admin en una ruta exclusiva de admin", () => {
    const res = createResponse();
    const next = jest.fn();

    autorizarRoles("admin")({ user: { rol: "admin" } }, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});
