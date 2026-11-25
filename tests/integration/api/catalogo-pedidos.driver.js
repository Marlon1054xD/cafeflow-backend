const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../src/app");
const connectToDatabase = require("../../../src/config/database");
const Cerveza = require("../../../src/models/cerveza.model");
const Pedido = require("../../../src/models/pedido.model");
const Usuario = require("../../../src/models/usuario.model");

const createdBeerIds = [];
const createdOrderIds = [];
const createdUserIds = [];

async function crearUsuario(rol) {
  const email = `api-${rol}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`;
  const usuario = await Usuario.create({
    nombre: `API ${rol}`,
    email,
    password: await bcrypt.hash("api-integration-password", 4),
    rol,
  });
  createdUserIds.push(usuario._id);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "api-integration-password" })
    .expect(200);
  return { id: usuario._id.toString(), token: login.body.access_token };
}

async function run() {
  await connectToDatabase();
  try {
    const cliente = await crearUsuario("cliente");
    const admin = await crearUsuario("admin");
    const pedidosIniciales = await request(app)
      .get("/api/pedidos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(200);
    assert.deepEqual(pedidosIniciales.body.pedidos, []);
    const datosCerveza = {
      nombre: "Lager Sprint QA",
      descripcion: "Cerveza de prueba predecible para automatización.",
      precio: 8500,
      disponible: true,
    };

    const catalogoPublico = await request(app).get("/api/cervezas").expect(200);
    assert.ok(Array.isArray(catalogoPublico.body.cervezas));
    await request(app).post("/api/cervezas").send(datosCerveza).expect(401);
    await request(app)
      .post("/api/cervezas")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send(datosCerveza)
      .expect(403);

    const cervezaResponse = await request(app)
      .post("/api/cervezas")
      .set("Authorization", `Bearer ${admin.token}`)
      .send(datosCerveza)
      .expect(201);
    const cerveza = cervezaResponse.body.cerveza;
    createdBeerIds.push(cerveza.id);
    assert.deepEqual(
      {
        nombre: cerveza.nombre,
        descripcion: cerveza.descripcion,
        precio: cerveza.precio,
        disponible: cerveza.disponible,
      },
      datosCerveza,
    );
    const detalleCerveza = await request(app)
      .get(`/api/cervezas/${cerveza.id}`)
      .expect(200);
    assert.equal(detalleCerveza.body.cerveza.id, cerveza.id);

    const pedidoResponse = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({ items: [{ cervezaId: cerveza.id, cantidad: 2 }] })
      .expect(201);
    const pedido = pedidoResponse.body.pedido;
    createdOrderIds.push(pedido.id);
    assert.equal(pedido.usuario, cliente.id);
    assert.equal(pedido.total, 17000);
    assert.equal(pedido.estado, "pendiente");
    assert.equal(pedido.items[0].precioUnitario, 8500);

    await new Promise((resolve) => setTimeout(resolve, 10));
    const siguientePedidoResponse = await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({ items: [{ cervezaId: cerveza.id, cantidad: 1 }] })
      .expect(201);
    const siguientePedido = siguientePedidoResponse.body.pedido;
    createdOrderIds.push(siguientePedido.id);

    await request(app)
      .patch(`/api/cervezas/${cerveza.id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ precio: 9000 })
      .expect(200);
    const detallePedido = await request(app)
      .get(`/api/pedidos/${pedido.id}`)
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(200);
    assert.equal(detallePedido.body.pedido.id, pedido.id);
    assert.equal(detallePedido.body.pedido.items[0].precioUnitario, 8500);
    assert.equal(detallePedido.body.pedido.total, 17000);
    await request(app)
      .get("/api/pedidos/no-es-un-id")
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(400);
    await request(app)
      .get("/api/pedidos/507f1f77bcf86cd799439011")
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(404);
    const otroCliente = await crearUsuario("cliente");
    await request(app)
      .get(`/api/pedidos/${pedido.id}`)
      .set("Authorization", `Bearer ${otroCliente.token}`)
      .expect(404);
    const listaCliente = await request(app)
      .get("/api/pedidos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(200);
    assert.ok(listaCliente.body.pedidos.some((item) => item.id === pedido.id));

    await request(app)
      .get("/api/pedidos/pendientes")
      .set("Authorization", `Bearer ${cliente.token}`)
      .expect(403);
    const pendientes = await request(app)
      .get("/api/pedidos/pendientes")
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    assert.ok(pendientes.body.pedidos.some((item) => item.id === pedido.id));
    const ordenesPendientes = pendientes.body.pedidos.map((item) => item.id);
    assert.ok(
      ordenesPendientes.indexOf(pedido.id) <
        ordenesPendientes.indexOf(siguientePedido.id),
    );
    const listaAdmin = await request(app)
      .get("/api/pedidos")
      .set("Authorization", `Bearer ${admin.token}`)
      .expect(200);
    assert.ok(listaAdmin.body.pedidos.some((item) => item.id === pedido.id));

    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({ estado: "en_preparacion" })
      .expect(403);
    const preparando = await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "en_preparacion" })
      .expect(200);
    assert.equal(preparando.body.pedido.estado, "en_preparacion");
    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "entregado" })
      .expect(409);
    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "listo" })
      .expect(200);
    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "entregado" })
      .expect(200);
    await request(app)
      .patch(`/api/pedidos/${pedido.id}/estado`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ estado: "en_preparacion" })
      .expect(409);
    await request(app)
      .post("/api/pedidos")
      .set("Authorization", `Bearer ${cliente.token}`)
      .send({ items: [] })
      .expect(400);

    console.log("API catálogo/pedidos: flujo completo aprobado.");
  } finally {
    if (createdOrderIds.length) {
      await Pedido.deleteMany({ _id: { $in: createdOrderIds } });
    }
    if (createdBeerIds.length) {
      await Cerveza.deleteMany({ _id: { $in: createdBeerIds } });
    }
    if (createdUserIds.length) {
      await Usuario.deleteMany({ _id: { $in: createdUserIds } });
    }
    await mongoose.disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
