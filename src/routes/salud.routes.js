const express = require("express");
const saludController = require("../controllers/salud.controller");

const router = express.Router();

router.get("/", saludController.obtenerSalud);

module.exports = router;
