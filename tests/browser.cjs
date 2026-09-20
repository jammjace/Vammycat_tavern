const { chromium } = require('@playwright/test');
const { mkdirSync } = require('node:fs');

async function loadFinalLevel(page) {
  mkdirSync('test-results', { recursive: true });
  page.setDefaultTimeout(90_000);
  await page.goto('http://127.0.0.1:5175');
  await page.waitForFunction(() => window.game?.scene.isActive('IntroScene'), null, { polling: 100 });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.game?.scene.getScene('GameScene').debugPanel, null, { polling: 100 });
  await page.evaluate(() => game.scene.getScene('GameScene').scene.restart({ levelIndex: 2 }));
  await page.waitForFunction(() => {
    const s = game.scene.getScene('GameScene');
    return s.sys.isActive() && s.levelIndex === 2 && s.debugPanel.element.isConnected;
  }, null, { polling: 100 });
}

module.exports = { chromium, loadFinalLevel };
