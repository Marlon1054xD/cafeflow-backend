const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../src/app");
const connectToDatabase = require("../../src/config/database");
const Usuario = require("../../src/models/usuario.model");

const createdEmails = new Set();
const tests = [];

function uniqueEmail() {
  const email = `integration-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}@example.test`;
  createdEmails.add(email);
  return email;
}

function registrationPayload(email, overrides = {}) {
  return {
    nombre: "Integration User",
    email,
    password: "integration-password",
    ...overrides,
  };
}

function integrationTest(name, run) {
  tests.push({ name, run });
}

integrationTest(
  "registration, login, and authenticated profile use MongoDB",
  async () => {
    const email = uniqueEmail();
    const registration = await request(app)
      .post("/api/auth/register")
      .send(registrationPayload(email, { rol: "admin" }))
      .expect(201);

    assert.deepEqual(registration.body.user, {
      id: registration.body.user.id,
      nombre: "Integration User",
      email,
      rol: "cliente",
    });
    assert.equal(Object.hasOwn(registration.body.user, "password"), false);

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "integration-password" })
      .expect(200);
    assert.equal(typeof login.body.access_token, "string");

    const profile = await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", `Bearer ${login.body.access_token}`)
      .expect(200);
    assert.deepEqual(profile.body.user, registration.body.user);
  },
);

integrationTest("duplicate emails and invalid registrations are rejected", async () => {
  const email = uniqueEmail();
  await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(email))
    .expect(201);
  await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(email))
    .expect(409);
  await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(uniqueEmail(), { password: "short" }))
    .expect(400);
});

integrationTest(
  "incorrect credentials and unauthenticated profile access are rejected",
  async () => {
    await request(app)
      .post("/api/auth/login")
      .send({
        email: "unknown@example.test",
        password: "wrong-password",
      })
      .expect(401);
    await request(app).get("/api/usuarios/me").expect(401);
    await request(app)
      .get("/api/usuarios/me")
      .set("Authorization", "Bearer invalid-token")
      .expect(401);
  },
);

integrationTest(
  "customer permissions and safe administrator listing are enforced",
  async () => {
    const customerEmail = uniqueEmail();
    await request(app)
      .post("/api/auth/register")
      .send(registrationPayload(customerEmail))
      .expect(201);
    const customerLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: customerEmail, password: "integration-password" })
      .expect(200);
    await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${customerLogin.body.access_token}`)
      .expect(403);

    const adminEmail = uniqueEmail();
    await Usuario.create({
      nombre: "Integration Admin",
      email: adminEmail,
      password: await bcrypt.hash("integration-password", 4),
      rol: "admin",
    });
    const adminLogin = await request(app)
      .post("/api/auth/login")
      .send({ email: adminEmail, password: "integration-password" })
      .expect(200);
    const users = await request(app)
      .get("/api/usuarios")
      .set("Authorization", `Bearer ${adminLogin.body.access_token}`)
      .expect(200);

    assert.ok(
      users.body.users.some(
        (user) => user.email === customerEmail && user.rol === "cliente",
      ),
    );
    assert.ok(
      users.body.users.some(
        (user) => user.email === adminEmail && user.rol === "admin",
      ),
    );
    assert.ok(users.body.users.every((user) => !("password" in user)));
  },
);

async function run() {
  let failures = 0;

  try {
    await connectToDatabase();
    await Usuario.init();

    for (const test of tests) {
      try {
        await test.run();
        console.log(`PASS ${test.name}`);
      } catch (error) {
        failures += 1;
        console.error(`FAIL ${test.name}`);
        console.error(error);
      } finally {
        if (createdEmails.size > 0) {
          await Usuario.deleteMany({ email: { $in: [...createdEmails] } });
          createdEmails.clear();
        }
      }
    }
  } catch (error) {
    failures += 1;
    console.error("No se pudieron ejecutar las pruebas contra MongoDB.");
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }

  if (failures > 0) {
    process.exitCode = 1;
    console.error(`${failures} prueba(s) de integración fallaron.`);
  } else {
    console.log(`Pruebas contra MongoDB: ${tests.length} pasaron.`);
  }
}

run();
