const mongoose = require("mongoose");

const cervezaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
    },
    precio: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    disponible: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Cerveza", cervezaSchema);
