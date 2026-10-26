const express = require("express");

const app = express();

app.use(express.json());
app.use("/api/salud", require("./routes/salud.routes"));

module.exports = app;
