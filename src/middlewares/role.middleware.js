function autorizarRoles(...rolesPermitidos) {
  return function autorizar(req, res, next) {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Autenticación requerida o inválida." });
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      return res
        .status(403)
        .json({ message: "No tienes permisos para este recurso." });
    }

    return next();
  };
}

module.exports = { autorizarRoles };
