const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Usuario = require("../src/models/usuario.model");
const {
  loadEnvironment,
  validateEnvironment,
} = require("../src/config/environment");
const { validateTestMongoUri } = require("../tests/integration/uri-safety");

async function seedTestAdmin() {
  process.env.NODE_ENV = "test";
  loadEnvironment();
  validateEnvironment();
  validateTestMongoUri(process.env.MONGODB_URI_TEST);

  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password || password.length < 8) {
    throw new Error(
      "TEST_ADMIN_EMAIL y TEST_ADMIN_PASSWORD (minimo 8 caracteres) son obligatorios.",
    );
  }

  await mongoose.connect(process.env.MONGODB_URI_TEST);
  const passwordHash = await bcrypt.hash(password, 12);
  await Usuario.findOneAndUpdate(
    { email: email.trim().toLowerCase() },
    {
      $set: {
        nombre: "CafeFlow Test Administrator",
        email: email.trim().toLowerCase(),
        password: passwordHash,
        rol: "admin",
      },
    },
    { upsert: true, returnDocument: "after", runValidators: true },
  );
  await mongoose.disconnect();
  console.log("Administrador de pruebas preparado en la base aislada.");
}

seedTestAdmin().catch(async (error) => {
  console.error(`No se pudo preparar el administrador de pruebas: ${error.message}`);
  await mongoose.disconnect();
  process.exitCode = 1;
});
