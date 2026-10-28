const usuarioService = require("../services/usuario.service");

function obtenerPerfil(req, res) {
  return res.status(200).json({ user: req.user });
}

async function listar(req, res) {
  const users = await usuarioService.listarUsuarios();
  return res.status(200).json({ users });
}

async function obtenerPorId(req, res) {
  const user = await usuarioService.obtenerUsuarioPorId(req.params.id);
  return res.status(200).json({ user });
}

async function obtenerEstadisticas(req, res) {
  const statistics = await usuarioService.obtenerEstadisticas();
  return res.status(200).json({ statistics });
}

async function actualizarPerfil(req, res) {
  const user = await usuarioService.actualizarPerfil(req.user.id, req.body || {});
  return res.status(200).json({ user });
}

module.exports = {
  actualizarPerfil,
  listar,
  obtenerEstadisticas,
  obtenerPerfil,
  obtenerPorId,
};
