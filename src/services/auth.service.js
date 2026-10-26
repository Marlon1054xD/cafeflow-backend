const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/usuario.model");
const usuarioService = require("./usuario.service");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_CREDENTIALS_MESSAGE = "Email o contraseña incorrectos.";

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function registrarUsuario({ nombre, email, password }) {
  return usuarioService.crearUsuario({
    nombre,
    email,
    password,
    rol: "cliente",
  });
}

async function iniciarSesion({ email, password }) {
  if (typeof email !== "string" || typeof password !== "string" || !password) {
    throw createError(400, "Email y contraseña son obligatorios.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw createError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const usuario = await Usuario.findOne({ email: normalizedEmail }).select(
    "+password",
  );
  if (
    !usuario ||
    !(await bcrypt.compare(password, usuario.password))
  ) {
    throw createError(401, INVALID_CREDENTIALS_MESSAGE);
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw createError(500, "La autenticación no está configurada.");
  }

  const accessToken = jwt.sign(
    { rol: usuario.rol },
    secret,
    {
      subject: usuario._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "1h",
    },
  );

  return {
    access_token: accessToken,
    user: usuarioService.toPublicUser(usuario),
  };
}

module.exports = { iniciarSesion, registrarUsuario };
