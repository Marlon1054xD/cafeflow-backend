const pedidoService = require("../services/pedido.service");

async function crear(req, res) {
  const pedido = await pedidoService.crearPedido(req.user.id, req.body);
  return res.status(201).json({ pedido });
}

async function listar(req, res) {
  const pedidos = await pedidoService.listarPedidos(req.user);
  return res.status(200).json({ pedidos });
}

async function listarPendientes(req, res) {
  const pedidos = await pedidoService.listarPendientes();
  return res.status(200).json({ pedidos });
}

async function obtenerPorId(req, res) {
  const pedido = await pedidoService.obtenerPedidoPorId(req.params.id, req.user);
  return res.status(200).json({ pedido });
}

async function actualizarEstado(req, res) {
  const pedido = await pedidoService.actualizarEstado(
    req.params.id,
    req.body,
  );
  return res.status(200).json({ pedido });
}

module.exports = {
  actualizarEstado,
  crear,
  listar,
  listarPendientes,
  obtenerPorId,
};
