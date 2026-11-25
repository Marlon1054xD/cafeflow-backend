const Cerveza = require("../models/cerveza.model");
const Pedido = require("../models/pedido.model");
const { isValidObjectId } = require("../utils/object-id");

const ESTADOS = [
  "pendiente",
  "en_preparacion",
  "listo",
  "entregado",
];
const TRANSICIONES = {
  pendiente: ["en_preparacion"],
  en_preparacion: ["listo"],
  listo: ["entregado"],
  entregado: [],
};

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPublicOrder(pedido) {
  return {
    id: pedido._id.toString(),
    usuario: pedido.usuario.toString(),
    items: pedido.items.map((item) => ({
      cervezaId: item.cerveza.toString(),
      nombre: item.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
    })),
    total: pedido.total,
    estado: pedido.estado,
    creadoEn: pedido.createdAt,
  };
}

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createError(400, "El pedido debe incluir al menos un producto.");
  }

  const ids = new Set();
  for (const item of items) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw createError(400, "Cada producto debe incluir cervezaId y cantidad.");
    }
    if (
      typeof item.cervezaId !== "string" ||
      !isValidObjectId(item.cervezaId)
    ) {
      throw createError(400, "El identificador de cerveza no es válido.");
    }
    if (!Number.isSafeInteger(item.cantidad) || item.cantidad < 1) {
      throw createError(400, "La cantidad debe ser un entero positivo.");
    }
    const id = item.cervezaId.toString();
    if (ids.has(id)) {
      throw createError(400, "No repitas una cerveza en el mismo pedido.");
    }
    ids.add(id);
  }
  return [...ids];
}

async function crearPedido(usuarioId, datos) {
  const ids = validarItems(datos && datos.items);
  const cervezas = await Cerveza.find({ _id: { $in: ids } }).lean();
  const porId = new Map(cervezas.map((cerveza) => [cerveza._id.toString(), cerveza]));
  const items = [];
  let total = 0;

  for (const solicitado of datos.items) {
    const cerveza = porId.get(solicitado.cervezaId.toString());
    if (!cerveza) {
      throw createError(404, "No se encontró una de las cervezas solicitadas.");
    }
    if (!cerveza.disponible) {
      throw createError(409, `La cerveza ${cerveza.nombre} no está disponible.`);
    }

    const subtotal = cerveza.precio * solicitado.cantidad;
    if (!Number.isSafeInteger(subtotal) || !Number.isSafeInteger(total + subtotal)) {
      throw createError(400, "El total del pedido excede el límite permitido.");
    }
    total += subtotal;
    items.push({
      cerveza: cerveza._id,
      nombre: cerveza.nombre,
      cantidad: solicitado.cantidad,
      precioUnitario: cerveza.precio,
    });
  }

  const pedido = await Pedido.create({
    usuario: usuarioId,
    items,
    total,
    estado: "pendiente",
  });
  return toPublicOrder(pedido);
}

async function listarPedidos(usuario) {
  const filtro = usuario.rol === "admin" ? {} : { usuario: usuario.id };
  const pedidos = await Pedido.find(filtro)
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  return pedidos.map(toPublicOrder);
}

async function listarPendientes() {
  const pedidos = await Pedido.find({ estado: "pendiente" })
    .sort({ createdAt: 1, _id: 1 })
    .lean();
  return pedidos.map(toPublicOrder);
}

async function obtenerPedidoPorId(id, usuario) {
  if (!isValidObjectId(id)) {
    throw createError(400, "El identificador del pedido no es válido.");
  }
  const pedido = await Pedido.findById(id).lean();
  if (!pedido || (usuario.rol !== "admin" && pedido.usuario.toString() !== usuario.id)) {
    throw createError(404, "No se encontró el pedido.");
  }
  return toPublicOrder(pedido);
}

async function actualizarEstado(id, datos) {
  if (!isValidObjectId(id)) {
    throw createError(400, "El identificador del pedido no es válido.");
  }
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos) ||
    Object.keys(datos).length !== 1 ||
    !Object.hasOwn(datos, "estado")
  ) {
    throw createError(400, "Solo puedes actualizar el estado del pedido.");
  }
  const nuevoEstado = datos.estado;
  if (!ESTADOS.includes(nuevoEstado)) {
    throw createError(400, "El estado del pedido no es válido.");
  }

  const pedido = await Pedido.findById(id);
  if (!pedido) {
    throw createError(404, "No se encontró el pedido.");
  }
  if (!TRANSICIONES[pedido.estado].includes(nuevoEstado)) {
    throw createError(
      409,
      `No se puede cambiar el pedido de ${pedido.estado} a ${nuevoEstado}.`,
    );
  }
  pedido.estado = nuevoEstado;
  await pedido.save();
  return toPublicOrder(pedido);
}

module.exports = {
  actualizarEstado,
  crearPedido,
  listarPendientes,
  listarPedidos,
  obtenerPedidoPorId,
};
