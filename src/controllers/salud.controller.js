const saludService = require("../services/salud.service");

function obtenerSalud(req, res) {
  const estadoSalud = saludService.obtenerEstadoSalud();
  return res.status(200).json(estadoSalud);
}

module.exports = { obtenerSalud };
