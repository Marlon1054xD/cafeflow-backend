const mongoose = require("mongoose");

function isValidObjectId(value) {
  return mongoose.isValidObjectId(value);
}

module.exports = { isValidObjectId };
