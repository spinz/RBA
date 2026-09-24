const { defineConfig } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  use: {
    baseURL: "http://127.0.0.1:3050",
    browserName: "chromium",
  },
  webServer: {
    command: "npm start",
    url: "http://127.0.0.1:3050",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
