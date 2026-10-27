const express = require("express");
const request = require("supertest");
const application = require("../../src/app");

const app = express();
app.use(express.json());
app.post("/__unit_test__/json", (req, res) => {
  res.status(200).json({ received: req.body });
});

describe("middleware JSON de Express", () => {
  test("analiza el cuerpo JSON antes de ejecutar la ruta", async () => {
    const payload = { nombre: "Prueba", activo: true };

    const response = await request(app)
      .post("/__unit_test__/json")
      .send(payload)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({ received: payload });
  });

  test("rechaza JSON malformado con HTTP 400", async () => {
    await request(app)
      .post("/__unit_test__/json")
      .set("Content-Type", "application/json")
      .send('{"nombre":')
      .expect(400);
  });

  test("la ruta de salud de la aplicación responde con su estado", async () => {
    const response = await request(application)
      .get("/api/salud")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual({
      estado: "ok",
      mensaje: "API de CaféFlow funcionando correctamente",
    });
  });
});
