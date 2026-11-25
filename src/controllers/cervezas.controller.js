const cervezaService = require("../services/cerveza.service");

async function listar(req, res) {
  const cervezas = await cervezaService.listarCervezas();
  return res.status(200).json({ cervezas });
}

async function obtenerPorId(req, res) {
  const cerveza = await cervezaService.obtenerCervezaPorId(req.params.id);
  return res.status(200).json({ cerveza });
}

async function crear(req, res) {
  const cerveza = await cervezaService.crearCerveza(req.body);
  return res.status(201).json({ cerveza });
}

async function actualizar(req, res) {
  const cerveza = await cervezaService.actualizarCerveza(
    req.params.id,
    req.body,
  );
  return res.status(200).json({ cerveza });
}

module.exports = { actualizar, crear, listar, obtenerPorId };
