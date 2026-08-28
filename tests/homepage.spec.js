const path = require('node:path');
const { test, expect } = require('@playwright/test');

// Пример smoke-теста для собранного сайта.
// Сейчас указывает на локальный placeholder в site/index.html — когда появится
// реальный сайт (или dev-сервер), замени testUrl на его адрес (http://localhost:...)
// или путь до нужного файла. Внешние URL из этой песочницы недоступны — это
// нормально, тестировать нужно то, что реально собрали, а не произвольные сайты.
const testUrl = 'file://' + path.resolve(__dirname, '../site/index.html');

test('главная страница открывается без ошибок консоли', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto(testUrl);
  await expect(page).toHaveTitle(/.+/);
  expect(consoleErrors).toEqual([]);
});
