const mongoose = require("mongoose");

async function connectToDatabase() {
  const { MONGODB_URI } = process.env;

  if (!MONGODB_URI) {
    const error = new Error("MONGODB_URI is required.");
    error.code = "MONGODB_URI_MISSING";
    throw error;
  }

  await mongoose.connect(MONGODB_URI);
}

module.exports = connectToDatabase;
