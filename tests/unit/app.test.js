const request = require("supertest");
const app = require("../../src/app");

describe("middleware JSON de Express", () => {
  beforeAll(() => {
    app.post("/__unit_test__/json", (req, res) => {
      res.status(200).json({ received: req.body });
    });
  });

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
});
