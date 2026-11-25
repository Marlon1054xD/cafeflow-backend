const mongoose = require("mongoose");

const itemPedidoSchema = new mongoose.Schema(
  {
    cerveza: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cerveza",
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false },
);

const pedidoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
    items: {
      type: [itemPedidoSchema],
      required: true,
      validate: {
        validator: (items) => items.length > 0,
        message: "El pedido debe incluir al menos un producto.",
      },
    },
    total: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    estado: {
      type: String,
      enum: ["pendiente", "en_preparacion", "listo", "entregado"],
      default: "pendiente",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Pedido", pedidoSchema);
