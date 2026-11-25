const express = require("express");
const cors = require("./middlewares/cors.middleware");

const app = express();

app.use(cors);
app.use(express.json());
app.use("/api/salud", require("./routes/salud.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/usuarios", require("./routes/usuarios.routes"));
app.use("/api/cervezas", require("./routes/cervezas.routes"));
app.use("/api/pedidos", require("./routes/pedidos.routes"));

const errorHandlers = require("./middlewares/error-handler.middleware");
app.use(errorHandlers.manejarRutaNoEncontrada);
app.use(errorHandlers.manejarErrores);

module.exports = app;
