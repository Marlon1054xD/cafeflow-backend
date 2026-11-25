const ALLOWED_METHODS = "GET,HEAD,POST,PATCH,OPTIONS";
const ALLOWED_HEADERS = "Authorization,Content-Type";

function parseAllowedOrigins() {
  return new Set(
    (process.env.CORS_ORIGINS || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean),
  );
}

function cors(req, res, next) {
  const origin = req.get("origin");
  if (!origin) {
    return next();
  }

  const allowedOrigins = parseAllowedOrigins();
  res.vary("Origin");

  if (allowedOrigins.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.set("Access-Control-Allow-Headers", ALLOWED_HEADERS);
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  return next();
}

module.exports = cors;
