const mongoose = require("mongoose");

async function connectToDatabase() {
  const isTestEnvironment = process.env.NODE_ENV === "test";
  const mongoUri = isTestEnvironment
    ? process.env.MONGODB_URI_TEST
    : process.env.MONGODB_URI;

  if (!mongoUri) {
    const variableName = isTestEnvironment ? "MONGODB_URI_TEST" : "MONGODB_URI";
    const error = new Error(`${variableName} is required.`);
    error.code = isTestEnvironment
      ? "MONGODB_URI_TEST_MISSING"
      : "MONGODB_URI_MISSING";
    throw error;
  }

  await mongoose.connect(mongoUri);
}

module.exports = connectToDatabase;
