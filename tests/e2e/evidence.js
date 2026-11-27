const fs = require("node:fs/promises");
const path = require("node:path");

async function captureFailureEvidence(driver, testName) {
  const evidenceDirectory =
    process.env.E2E_EVIDENCE_DIR ||
    path.resolve(__dirname, "../../reports/e2e");
  const safeName = testName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const filePath = path.join(evidenceDirectory, `${safeName}-fallo.png`);

  await fs.mkdir(evidenceDirectory, { recursive: true });
  await fs.writeFile(filePath, await driver.takeScreenshot(), "base64");
  console.error(`Evidencia Selenium guardada en ${filePath}`);
}

module.exports = captureFailureEvidence;
