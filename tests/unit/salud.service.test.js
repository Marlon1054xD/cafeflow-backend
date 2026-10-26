const saludService = require("../../src/services/salud.service");

describe("saludService", () => {
  it("reports the API as healthy", () => {
    expect(saludService.obtenerEstadoSalud()).toEqual({
      estado: "ok",
      mensaje: "API de CaféFlow funcionando correctamente",
    });
  });
});
