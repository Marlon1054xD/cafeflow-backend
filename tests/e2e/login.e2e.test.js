const assert = require("node:assert/strict");
const { test } = require("node:test");
const createBrowser = require("./browser");
const captureFailureEvidence = require("./evidence");
const LoginPage = require("./pages/LoginPage");

test("una contraseña incorrecta muestra el error y conserva /login", async () => {
  let driver;
  let loginPage;
  try {
    driver = await createBrowser();
    loginPage = new LoginPage(driver, process.env.FRONTEND_BASE_URL);
    await loginPage.open();

    const outcome = await loginPage.submit(
      process.env.E2E_USER_EMAIL,
      process.env.E2E_USER_PASSWORD_INCORRECT,
    );

    assert.equal(outcome, "error");
    assert.match(await loginPage.errorText(), /contraseña incorrectos/i);
    assert.equal(await loginPage.currentPath(), "/login");
  } catch (error) {
    if (driver) {
      try {
        if (loginPage) {
          await loginPage.clearCredentialFields();
        }
        await captureFailureEvidence(driver, "login-invalido");
      } catch (evidenceError) {
        console.error(
          `No se pudo capturar evidencia Selenium: ${evidenceError.message}`,
        );
      }
    } else {
      console.error("No se pudo abrir Chrome; no hay captura de navegador.");
    }
    throw error;
  } finally {
    if (driver) {
      await driver.quit();
    }
  }
});
