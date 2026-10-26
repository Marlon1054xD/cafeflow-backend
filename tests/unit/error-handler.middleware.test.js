const {
  manejarErrores,
  manejarRutaNoEncontrada,
} = require("../../src/middlewares/error-handler.middleware");

function createResponse(headersSent = false) {
  return {
    headersSent,
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("error-handler.middleware", () => {
  test("responde 404 con message cuando no encuentra una ruta", () => {
    const res = createResponse();

    manejarRutaNoEncontrada({}, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: "Ruta no encontrada.",
    });
  });

  test("delegates el error si los headers ya se enviaron", () => {
    const error = new Error("already sent");
    const next = jest.fn();
    const res = createResponse(true);

    manejarErrores(error, {}, res, next);

    expect(next).toHaveBeenCalledWith(error);
    expect(res.status).not.toHaveBeenCalled();
  });

  test("devuelve el status y mensaje de errores de cliente", () => {
    const res = createResponse();

    manejarErrores(
      Object.assign(new Error("Datos inválidos"), { statusCode: 422 }),
      {},
      res,
      jest.fn(),
    );

    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json).toHaveBeenCalledWith({ message: "Datos inválidos" });
  });

  test.each([
    [Object.assign(new Error("validation"), { name: "ValidationError" }), 400],
    [Object.assign(new Error("parse"), { type: "entity.parse.failed" }), 400],
    [Object.assign(new Error("duplicate"), { code: 11000 }), 409],
  ])("normaliza errores de validación y duplicado", (error, statusCode) => {
    const res = createResponse();

    manejarErrores(error, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(statusCode);
    expect(res.json).toHaveBeenCalledWith({
      message:
        statusCode === 409
          ? "Ya existe una cuenta con ese email."
          : "Los datos enviados no son válidos.",
    });
  });

  test("oculta detalles de errores internos", () => {
    const res = createResponse();

    manejarErrores(new Error("secret database detail"), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Error interno del servidor.",
    });
  });
});
