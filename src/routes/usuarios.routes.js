const express = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { autorizarRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/me", autenticar, usuariosController.obtenerPerfil);
router.patch("/me", autenticar, usuariosController.actualizarPerfil);
router.get(
  "/estadisticas",
  autenticar,
  autorizarRoles("admin"),
  usuariosController.obtenerEstadisticas,
);
router.get("/", autenticar, autorizarRoles("admin"), usuariosController.listar);
router.get(
  "/:id",
  autenticar,
  autorizarRoles("admin"),
  usuariosController.obtenerPorId,
);

module.exports = router;
