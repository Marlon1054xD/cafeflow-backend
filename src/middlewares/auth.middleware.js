const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Usuario = require("../models/usuario.model");

function unauthorized(res) {
  return res
    .status(401)
    .json({ message: "Autenticación requerida o inválida." });
}

async function autenticar(req, res, next) {
  const authorization = req.get("authorization") || "";
  const parts = authorization.split(" ");
  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer" ||
    !parts[1]
  ) {
    return unauthorized(res);
  }
  const token = parts[1];

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error("La autenticación no está configurada.");
    error.statusCode = 500;
    return next(error);
  }

  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return unauthorized(res);
    }
    return next(error);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.sub !== "string" ||
    !mongoose.isValidObjectId(payload.sub)
  ) {
    return unauthorized(res);
  }

  const usuario = await Usuario.findById(payload.sub).select(
    "nombre email rol",
  );
  if (!usuario) {
    return unauthorized(res);
  }

  req.user = {
    id: usuario._id.toString(),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
  };
  return next();
}

module.exports = { autenticar };
