function manejarRutaNoEncontrada(req, res) {
  return res.status(404).json({ message: "Ruta no encontrada." });
}

function manejarErrores(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  let statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;
  let message =
    statusCode < 500 ? error.message : "Error interno del servidor.";

  if (error.name === "ValidationError" || error.type === "entity.parse.failed") {
    statusCode = 400;
    message = "Los datos enviados no son válidos.";
  } else if (error.code === 11000) {
    statusCode = 409;
    message = "Ya existe una cuenta con ese email.";
  }

  return res.status(statusCode).json({ message });
}

module.exports = { manejarErrores, manejarRutaNoEncontrada };
