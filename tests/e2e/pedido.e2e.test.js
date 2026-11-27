const assert = require("node:assert/strict");
const { test } = require("node:test");
const createBrowser = require("./browser");
const captureFailureEvidence = require("./evidence");
const CatalogPage = require("./pages/CatalogPage");
const LoginPage = require("./pages/LoginPage");
const PedidoDetailPage = require("./pages/PedidoDetailPage");

test("cliente crea un pedido de dos Lager y consulta su detalle", async () => {
  let driver;
  let loginPage;
  try {
    driver = await createBrowser();
    loginPage = new LoginPage(driver, process.env.FRONTEND_BASE_URL);
    await loginPage.open();

    const loginOutcome = await loginPage.submit(
      process.env.E2E_USER_EMAIL,
      process.env.E2E_USER_PASSWORD,
    );
    assert.equal(loginOutcome, "success");
    assert.equal(await loginPage.currentPath(), "/catalogo");

    const catalogPage = new CatalogPage(driver);
    await catalogPage.waitUntilLoaded(process.env.E2E_BEER_ID);
    const beerCardText = await catalogPage.beerCardText(
      process.env.E2E_BEER_ID,
    );
    assert.match(beerCardText, new RegExp(process.env.E2E_BEER_NAME));
    assert.match(beerCardText, /8[.\u00a0]500/);
    assert.match(beerCardText, /Disponible/);

    const orderPath = await catalogPage.placeOrder(
      process.env.E2E_BEER_ID,
      2,
    );
    assert.match(orderPath, /^\/pedidos\/[a-f\d]{24}$/i);

    const detailPage = new PedidoDetailPage(driver);
    await detailPage.waitUntilLoaded();
    assert.match(await detailPage.itemText(), new RegExp(process.env.E2E_BEER_NAME));
    assert.match(await detailPage.itemText(), /Cantidad:\s*2/);
    assert.match(await detailPage.totalText(), /17[.\u00a0]000/);
    assert.match(await detailPage.statusText(), /pendiente/i);
    assert.equal(
      await detailPage.returnToCatalogText(),
      "Volver al catálogo",
    );
    assert.match(await detailPage.currentPath(), /^\/pedidos\//);
  } catch (error) {
    if (driver) {
      try {
        if (loginPage) {
          await loginPage.clearCredentialFields();
        }
        await captureFailureEvidence(driver, "pedido-detalle");
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
