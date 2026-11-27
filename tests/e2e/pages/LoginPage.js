const { By } = require("selenium-webdriver");

const LOGIN_TIMEOUT_MS = 10000;

class LoginPage {
  constructor(driver, frontendUrl) {
    this.driver = driver;
    this.frontendUrl = frontendUrl;
  }

  async open() {
    await this.driver.get(`${this.frontendUrl}/login`);
    await this.driver.wait(async () => {
      const emailFields = await this.driver.findElements(By.id("login-email"));
      return emailFields.length > 0 && emailFields[0].isDisplayed();
    }, LOGIN_TIMEOUT_MS);
  }

  async submit(email, password) {
    await this.driver.findElement(By.id("login-email")).sendKeys(email);
    await this.driver.findElement(By.id("login-password")).sendKeys(password);
    await this.driver.findElement(By.id("login-submit")).click();

    return this.driver.wait(async () => {
      const currentPath = new URL(await this.driver.getCurrentUrl()).pathname;
      if (currentPath === "/catalogo") {
        return "success";
      }

      const errors = await this.driver.findElements(
        By.css('[data-testid="login-error"]'),
      );
      if (errors.length > 0 && (await errors[0].isDisplayed())) {
        return "error";
      }

      return false;
    }, LOGIN_TIMEOUT_MS);
  }

  async currentPath() {
    return new URL(await this.driver.getCurrentUrl()).pathname;
  }

  async errorText() {
    return this.driver
      .findElement(By.css('[data-testid="login-error"]'))
      .getText();
  }

  async clearCredentialFields() {
    const fields = await this.driver.findElements(
      By.css('input[type="email"], input[type="password"]'),
    );
    for (const field of fields) {
      await field.clear();
    }
  }
}

module.exports = LoginPage;
