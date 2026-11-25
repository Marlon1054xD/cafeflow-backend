const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Cerveza = require("../../../src/models/cerveza.model");
const Pedido = require("../../../src/models/pedido.model");
const Usuario = require("../../../src/models/usuario.model");
const connectToDatabase = require("../../../src/config/database");
const pedidoService = require("../../../src/services/pedido.service");

const createdBeerIds = [];
const createdOrderIds = [];
const createdUserIds = [];

async function crearDatos(disponible) {
  const usuario = await Usuario.create({
    nombre: "Bottom-up Test",
    email: `bottom-up-${Date.now()}-${Math.random().toString(16).slice(2)}@example.test`,
    password: "no-login-needed",
    rol: "cliente",
  });
  createdUserIds.push(usuario._id);
  const cerveza = await Cerveza.create({
    nombre: `Bottom-up Beer ${Date.now()}`,
    descripcion: "Producto aislado para prueba de integración",
    precio: 12500,
    disponible,
  });
  createdBeerIds.push(cerveza._id);
  return { usuario, cerveza };
}

async function run() {
  await connectToDatabase();
  try {
    const { usuario, cerveza } = await crearDatos(true);
    const respuesta = await pedidoService.crearPedido(usuario._id.toString(), {
      items: [{ cervezaId: cerveza._id.toString(), cantidad: 3 }],
    });
    createdOrderIds.push(respuesta.id);

    const persistido = await Pedido.findById(respuesta.id).lean();
    assert.equal(persistido.total, 37500);
    assert.equal(persistido.items[0].precioUnitario, 12500);
    assert.equal(persistido.estado, "pendiente");

    const noDisponible = await crearDatos(false);
    const antes = await Pedido.countDocuments({
      usuario: noDisponible.usuario._id,
    });
    await assert.rejects(
      pedidoService.crearPedido(noDisponible.usuario._id.toString(), {
        items: [
          {
            cervezaId: noDisponible.cerveza._id.toString(),
            cantidad: 1,
          },
        ],
      }),
      { statusCode: 409 },
    );
    assert.equal(
      await Pedido.countDocuments({ usuario: noDisponible.usuario._id }),
      antes,
    );
    console.log("Bottom-up pedidos: 2 escenarios aprobados.");
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
