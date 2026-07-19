// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:8790',
    viewport: { width: 390, height: 844 }
  },
  webServer: {
    command: 'python3 -m http.server 8790',
    url: 'http://127.0.0.1:8790',
    reuseExistingServer: true,
    timeout: 120000
  }
});
