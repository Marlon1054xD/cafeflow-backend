jest.mock("../../../src/services/salud.service", () => ({
  obtenerEstadoSalud: jest.fn(),
}));

const request = require("supertest");
const saludService = require("../../../src/services/salud.service");
const app = require("../../../src/app");

describe("Top-down: GET /api/salud", () => {
  afterEach(() => {
    saludService.obtenerEstadoSalud.mockReset();
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("integra la ruta y el controlador con una respuesta de servicio stub", async () => {
    const respuestaStub = {
      estado: "stub",
      mensaje: "respuesta controlada por la prueba",
    };
    saludService.obtenerEstadoSalud.mockReturnValue(respuestaStub);

    const response = await request(app).get("/api/salud");

    expect(response.status).toBe(200);
    expect(response.body).toEqual(respuestaStub);
    expect(saludService.obtenerEstadoSalud).toHaveBeenCalledTimes(1);
  });
});
