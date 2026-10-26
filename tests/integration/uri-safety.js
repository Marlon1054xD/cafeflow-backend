function validateTestMongoUri(uri) {
  let parsedUri;

  try {
    parsedUri = new URL(uri);
  } catch {
    throw new Error("MONGODB_URI_TEST debe ser una URI de MongoDB válida.");
  }

  if (
    !["mongodb:", "mongodb+srv:"].includes(parsedUri.protocol) ||
    !parsedUri.hostname
  ) {
    throw new Error("MONGODB_URI_TEST debe usar mongodb o mongodb+srv y un host válido.");
  }

  let databaseName;
  try {
    databaseName = decodeURIComponent(parsedUri.pathname.slice(1));
  } catch {
    throw new Error("MONGODB_URI_TEST debe incluir un nombre de base de pruebas válido.");
  }

  const overrideDatabaseName = parsedUri.searchParams.get("dbName");
  if (overrideDatabaseName && overrideDatabaseName !== databaseName) {
    throw new Error("MONGODB_URI_TEST no puede cambiar la base con la opción dbName.");
  }

  if (!databaseName || !/(^|[-_])(test|tests|testing)([-_]|$)/i.test(databaseName)) {
    throw new Error(
      "La base indicada por MONGODB_URI_TEST debe identificarse explícitamente como una base de pruebas (por ejemplo, cafeflow_test).",
    );
  }

  return databaseName;
}

module.exports = { validateTestMongoUri };
