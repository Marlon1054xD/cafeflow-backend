const usuarioService = require("../services/usuario.service");

function obtenerPerfil(req, res) {
  return res.status(200).json({ user: req.user });
}

async function listar(req, res) {
  const users = await usuarioService.listarUsuarios();
  return res.status(200).json({ users });
}

module.exports = { listar, obtenerPerfil };
