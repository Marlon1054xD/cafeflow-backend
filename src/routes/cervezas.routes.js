const express = require("express");
const cervezasController = require("../controllers/cervezas.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { autorizarRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.get("/", cervezasController.listar);
router.get("/:id", cervezasController.obtenerPorId);
router.post(
  "/",
  autenticar,
  autorizarRoles("admin"),
  cervezasController.crear,
);
router.patch(
  "/:id",
  autenticar,
  autorizarRoles("admin"),
  cervezasController.actualizar,
);

module.exports = router;
