const { By } = require("selenium-webdriver");

const DETAIL_TIMEOUT_MS = 15000;

class PedidoDetailPage {
  constructor(driver) {
    this.driver = driver;
  }

  async waitUntilLoaded() {
    await this.driver.wait(async () => {
      const details = await this.driver.findElements(
        By.css('[data-testid="pedido-detalle"]'),
      );
      const totals = await this.driver.findElements(
        By.css('[data-testid="pedido-total"]'),
      );
      const statuses = await this.driver.findElements(
        By.css('[data-testid="pedido-estado"]'),
      );
      return details.length > 0 && totals.length > 0 && statuses.length > 0;
    }, DETAIL_TIMEOUT_MS);
  }

  async itemText() {
    return this.driver.findElement(By.css(".order-item")).getText();
  }

  async totalText() {
    return this.driver
      .findElement(By.css('[data-testid="pedido-total"]'))
      .getText();
  }

  async statusText() {
    return this.driver
      .findElement(By.css('[data-testid="pedido-estado"]'))
      .getText();
  }

  async returnToCatalogText() {
    const returnLink = this.driver.findElement(
      By.xpath("//a[normalize-space(.)='Volver al catálogo']"),
    );
    await this.driver.wait(
      async () => returnLink.isDisplayed(),
      DETAIL_TIMEOUT_MS,
    );
    return returnLink.getText();
  }

  async currentPath() {
    return new URL(await this.driver.getCurrentUrl()).pathname;
  }
}

module.exports = PedidoDetailPage;
