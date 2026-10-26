const authService = require("../services/auth.service");

async function registrar(req, res) {
  const { nombre, email, password } = req.body || {};
  const user = await authService.registrarUsuario({ nombre, email, password });
  return res.status(201).json({ user });
}

async function iniciarSesion(req, res) {
  const { email, password } = req.body || {};
  const result = await authService.iniciarSesion({ email, password });
  return res.status(200).json(result);
}

module.exports = { iniciarSesion, registrar };
