const crypto = require("node:crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Cerveza = require("../../src/models/cerveza.model");
const Pedido = require("../../src/models/pedido.model");
const Usuario = require("../../src/models/usuario.model");

async function connectToTestDatabase() {
  const { loadEnvironment, validateEnvironment } = require(
    "../../src/config/environment",
  );
  const { validateTestMongoUri } = require("../integration/uri-safety");

  process.env.NODE_ENV = "test";
  loadEnvironment();
  validateEnvironment();
  validateTestMongoUri(process.env.MONGODB_URI_TEST);
  await mongoose.connect(process.env.MONGODB_URI_TEST, {
    serverSelectionTimeoutMS: 5000,
  });
}

async function prepareFixtures() {
  await connectToTestDatabase();
  const runId = crypto.randomUUID();
  const email = `selenium-${runId}@example.test`;
  const password = crypto.randomBytes(24).toString("base64url");
  const beerName = `Lager Selenium ${runId.slice(0, 8)}`;
  let user;
  let beer;

  try {
    user = await Usuario.create({
      nombre: "Cliente Selenium",
      email,
      password: await bcrypt.hash(password, 12),
      rol: "cliente",
    });
    beer = await Cerveza.create({
      nombre: beerName,
      descripcion: "Lager disponible para la regresión Selenium.",
      precio: 8500,
      disponible: true,
    });

    return {
      beerId: beer._id.toString(),
      beerName,
      email,
      password,
      userId: user._id.toString(),
    };
  } catch (error) {
    try {
      if (beer) {
        await Cerveza.deleteOne({ _id: beer._id });
      }
      if (user) {
        await Usuario.deleteOne({ _id: user._id });
      }
    } finally {
      await mongoose.disconnect();
    }
    throw error;
  }
}

async function removeFixtures(fixture) {
  try {
    await Pedido.deleteMany({
      usuario: fixture.userId,
      "items.cerveza": fixture.beerId,
    });
    await Cerveza.deleteOne({ _id: fixture.beerId });
    await Usuario.deleteOne({ _id: fixture.userId });
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { prepareFixtures, removeFixtures };
