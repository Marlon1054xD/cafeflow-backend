const express = require("express");
const pedidosController = require("../controllers/pedidos.controller");
const { autenticar } = require("../middlewares/auth.middleware");
const { autorizarRoles } = require("../middlewares/role.middleware");

const router = express.Router();

router.post("/", autenticar, pedidosController.crear);
router.get("/", autenticar, pedidosController.listar);
router.get(
  "/pendientes",
  autenticar,
  autorizarRoles("admin"),
  pedidosController.listarPendientes,
);
router.get("/:id", autenticar, pedidosController.obtenerPorId);
router.patch(
  "/:id/estado",
  autenticar,
  autorizarRoles("admin"),
  pedidosController.actualizarEstado,
);

module.exports = router;
