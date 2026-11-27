const { Builder } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");

async function createBrowser() {
  const options = new chrome.Options();
  if (process.env.E2E_HEADLESS !== "false") {
    options.addArguments("--headless=new");
  }
  options.addArguments("--window-size=1440,1000", "--disable-extensions");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  await driver.manage().setTimeouts({
    implicit: 0,
    pageLoad: 20000,
    script: 10000,
  });
  return driver;
}

module.exports = createBrowser;
