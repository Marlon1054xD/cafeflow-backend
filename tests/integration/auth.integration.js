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

async function createAdmin() {
  const email = uniqueEmail();
  const usuario = await Usuario.create({
    nombre: "Integration Admin",
    email,
    password: await bcrypt.hash("integration-password", 4),
    rol: "admin",
  });
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "integration-password" })
    .expect(200);

  return { email, id: usuario._id.toString(), token: login.body.access_token };
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

integrationTest("customers can update their own public profile", async () => {
  const email = uniqueEmail();
  const registration = await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(email))
    .expect(201);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "integration-password" })
    .expect(200);

  const update = await request(app)
    .patch("/api/usuarios/me")
    .set("Authorization", `Bearer ${login.body.access_token}`)
    .send({ nombre: "Updated Integration User", email: `updated-${email}` })
    .expect(200);

  createdEmails.add(`updated-${email}`);

  assert.equal(update.body.user.id, registration.body.user.id);
  assert.equal(update.body.user.nombre, "Updated Integration User");
  assert.equal(update.body.user.email, `updated-${email}`);
  assert.equal(Object.hasOwn(update.body.user, "password"), false);
});

integrationTest("profile updates reject role and password changes", async () => {
  const email = uniqueEmail();
  await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(email))
    .expect(201);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email, password: "integration-password" })
    .expect(200);

  await request(app)
    .patch("/api/usuarios/me")
    .set("Authorization", `Bearer ${login.body.access_token}`)
    .send({ rol: "admin" })
    .expect(400);
  await request(app)
    .patch("/api/usuarios/me")
    .set("Authorization", `Bearer ${login.body.access_token}`)
    .send({ password: "new-password" })
    .expect(400);
});

integrationTest("profile updates reject duplicate emails", async () => {
  const firstEmail = uniqueEmail();
  const secondEmail = uniqueEmail();
  await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(firstEmail))
    .expect(201);
  await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(secondEmail))
    .expect(201);
  const login = await request(app)
    .post("/api/auth/login")
    .send({ email: firstEmail, password: "integration-password" })
    .expect(200);

  await request(app)
    .patch("/api/usuarios/me")
    .set("Authorization", `Bearer ${login.body.access_token}`)
    .send({ email: secondEmail })
    .expect(409);
});

integrationTest("administrators can retrieve a public user by id", async () => {
  const targetEmail = uniqueEmail();
  const target = await request(app)
    .post("/api/auth/register")
    .send(registrationPayload(targetEmail))
    .expect(201);
  const admin = await createAdmin();

  const response = await request(app)
    .get(`/api/usuarios/${target.body.user.id}`)
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(200);

  assert.deepEqual(response.body.user, target.body.user);
});

integrationTest("user lookup rejects invalid and missing ids", async () => {
  const admin = await createAdmin();
  await request(app)
    .get("/api/usuarios/no-es-un-id")
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(400);
  await request(app)
    .get("/api/usuarios/507f1f77bcf86cd799439011")
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(404);
});

integrationTest("only administrators can read user statistics", async () => {
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
    .get("/api/usuarios/estadisticas")
    .set("Authorization", `Bearer ${customerLogin.body.access_token}`)
    .expect(403);

  const admin = await createAdmin();
  const response = await request(app)
    .get("/api/usuarios/estadisticas")
    .set("Authorization", `Bearer ${admin.token}`)
    .expect(200);
  const [clientes, administradores] = await Promise.all([
    Usuario.countDocuments({ rol: "cliente" }),
    Usuario.countDocuments({ rol: "admin" }),
  ]);
  assert.deepEqual(response.body.statistics, {
    total: clientes + administradores,
    clientes,
    administradores,
  });
});

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
