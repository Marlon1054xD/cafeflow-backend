const express = require("express");
const usuariosController = require("../controllers/usuarios.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { autorizarRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/me", autenticar, usuariosController.obtenerPerfil);
router.get("/", autenticar, autorizarRoles("admin"), usuariosController.listar);

module.exports = router;
