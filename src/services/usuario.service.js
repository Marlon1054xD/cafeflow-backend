const bcrypt = require("bcryptjs");
const Usuario = require("../models/usuario.model");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BCRYPT_ROUNDS = 12;

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPublicUser(usuario) {
  return {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
}

function validateNewUser({ nombre, email, password, rol }) {
  if (typeof nombre !== "string" || nombre.trim().length === 0) {
    throw createError(400, "El nombre es obligatorio.");
  }

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    throw createError(400, "El email no es válido.");
  }

  if (typeof password !== "string" || [...password].length < 8) {
    throw createError(400, "La contraseña debe tener al menos 8 caracteres.");
  }

  if (!["cliente", "admin"].includes(rol)) {
    throw createError(400, "El rol no es válido.");
  }

  return { nombre: nombre.trim(), email: normalizedEmail, password, rol };
}

async function crearUsuario(datos) {
  const usuarioValidado = validateNewUser(datos);
  const passwordHash = await bcrypt.hash(
    usuarioValidado.password,
    BCRYPT_ROUNDS,
  );

  try {
    const usuario = await Usuario.create({
      nombre: usuarioValidado.nombre,
      email: usuarioValidado.email,
      password: passwordHash,
      rol: usuarioValidado.rol,
    });
    return toPublicUser(usuario);
  } catch (error) {
    if (error.code === 11000) {
      throw createError(409, "Ya existe una cuenta con ese email.");
    }
    throw error;
  }
}

async function listarUsuarios() {
  const usuarios = await Usuario.find()
    .select("nombre email rol")
    .sort({ _id: 1 })
    .lean();

  return usuarios.map(toPublicUser);
}

module.exports = { crearUsuario, listarUsuarios, toPublicUser };
