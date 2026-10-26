const mongoose = require("mongoose");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      match: EMAIL_REGEX,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    rol: {
      type: String,
      enum: ["cliente", "admin"],
      default: "cliente",
      required: true,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Usuario", usuarioSchema);
