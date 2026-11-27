const { By } = require("selenium-webdriver");

const CATALOG_TIMEOUT_MS = 15000;
const ORDER_TIMEOUT_MS = 15000;

class CatalogPage {
  constructor(driver) {
    this.driver = driver;
  }

  async waitUntilLoaded(beerId) {
    await this.driver.wait(async () => {
      const catalog = await this.driver.findElements(
        By.css('[data-testid="catalogo"]'),
      );
      const beerCard = await this.driver.findElements(
        By.css(`.beer-card[data-cerveza-id="${beerId}"]`),
      );
      return (
        catalog.length > 0 &&
        beerCard.length > 0 &&
        (await beerCard[0].isDisplayed())
      );
    }, CATALOG_TIMEOUT_MS);
  }

  async beerCardText(beerId) {
    return this.driver
      .findElement(By.css(`.beer-card[data-cerveza-id="${beerId}"]`))
      .getText();
  }

  async placeOrder(beerId, quantity) {
    const beerCard = this.driver.findElement(
      By.css(`.beer-card[data-cerveza-id="${beerId}"]`),
    );
    await beerCard
      .findElement(By.css('[data-testid="pedir-cerveza"]'))
      .click();

    const quantityField = this.driver.findElement(By.id("pedido-cantidad"));
    await quantityField.clear();
    await quantityField.sendKeys(String(quantity));
    await this.driver.findElement(By.id("pedido-confirmar")).click();

    await this.driver.wait(async () => {
      const currentPath = new URL(await this.driver.getCurrentUrl()).pathname;
      return /^\/pedidos\/[a-f\d]{24}$/i.test(currentPath);
    }, ORDER_TIMEOUT_MS);

    return new URL(await this.driver.getCurrentUrl()).pathname;
  }
}

module.exports = CatalogPage;
