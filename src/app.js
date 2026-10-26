const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/salud", require("./routes/salud.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/usuarios", require("./routes/usuarios.routes"));

const errorHandlers = require("./middlewares/error-handler.middleware");
app.use(errorHandlers.manejarRutaNoEncontrada);
app.use(errorHandlers.manejarErrores);

module.exports = app;
