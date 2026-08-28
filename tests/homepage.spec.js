const path = require('node:path');
const { test, expect } = require('@playwright/test');

// Smoke-тест для собранного сайта. Папка называется docs/, а не site/, —
// так GitHub Pages может публиковать её напрямую (Settings → Pages → Deploy
// from a branch → main → /docs) без отдельного workflow и без токена с
// правом `workflow`.
const testUrl = 'file://' + path.resolve(__dirname, '../docs/index.html');

test('главная страница открывается без ошибок консоли', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(testUrl);
  await expect(page).toHaveTitle(/.+/);
  expect(consoleErrors).toEqual([]);
});
