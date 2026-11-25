const Cerveza = require("../models/cerveza.model");
const { isValidObjectId } = require("../utils/object-id");

const CAMPOS_CERVEZA = ["nombre", "descripcion", "precio", "disponible"];

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function validarCampos(datos, { parcial = false } = {}) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw createError(400, "Los datos de la cerveza no son válidos.");
  }

  const campos = Object.keys(datos);
  if (
    campos.length === 0 ||
    campos.some((campo) => !CAMPOS_CERVEZA.includes(campo))
  ) {
    throw createError(400, "Solo puedes enviar nombre, descripcion, precio y disponible.");
  }

  if (!parcial && CAMPOS_CERVEZA.some((campo) => !Object.hasOwn(datos, campo))) {
    throw createError(400, "Todos los campos de la cerveza son obligatorios.");
  }

  const normalizados = {};
  for (const campo of campos) {
    const valor = datos[campo];
    if (campo === "nombre" || campo === "descripcion") {
      if (typeof valor !== "string" || valor.trim().length === 0) {
        throw createError(400, `El campo ${campo} es obligatorio.`);
      }
      normalizados[campo] = valor.trim();
    } else if (campo === "precio") {
      if (!Number.isSafeInteger(valor) || valor < 1) {
        throw createError(400, "El precio debe ser un entero positivo en COP.");
      }
      normalizados.precio = valor;
    } else {
      if (typeof valor !== "boolean") {
        throw createError(400, "El campo disponible debe ser booleano.");
      }
      normalizados.disponible = valor;
    }
  }

  return normalizados;
}

function toPublicBeer(cerveza) {
  return {
    id: cerveza._id.toString(),
    nombre: cerveza.nombre,
    descripcion: cerveza.descripcion,
    precio: cerveza.precio,
    disponible: cerveza.disponible,
  };
}

async function listarCervezas() {
  const cervezas = await Cerveza.find().sort({ nombre: 1, _id: 1 }).lean();
  return cervezas.map(toPublicBeer);
}

async function obtenerCervezaPorId(id) {
  if (!isValidObjectId(id)) {
    throw createError(400, "El identificador de cerveza no es válido.");
  }
  const cerveza = await Cerveza.findById(id).lean();
  if (!cerveza) {
    throw createError(404, "No se encontró la cerveza.");
  }
  return toPublicBeer(cerveza);
}

async function crearCerveza(datos) {
  const cerveza = await Cerveza.create(validarCampos(datos));
  return toPublicBeer(cerveza);
}

async function actualizarCerveza(id, datos) {
  if (!isValidObjectId(id)) {
    throw createError(400, "El identificador de cerveza no es válido.");
  }
  const actualizacion = validarCampos(datos, { parcial: true });
  const cerveza = await Cerveza.findByIdAndUpdate(id, actualizacion, {
    returnDocument: "after",
    runValidators: true,
  }).lean();
  if (!cerveza) {
    throw createError(404, "No se encontró la cerveza.");
  }
  return toPublicBeer(cerveza);
}

module.exports = {
  actualizarCerveza,
  crearCerveza,
  listarCervezas,
  obtenerCervezaPorId,
};
