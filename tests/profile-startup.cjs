const { chromium, expect } = require('@playwright/test');
const { mkdirSync, writeFileSync } = require('node:fs');

(async () => {
  const label = process.argv[2] || 'current', count = Number(process.argv[3] || 3);
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const results = [];
  mkdirSync('performance-results', { recursive: true });
  try {
    for (let run = 0; run < count; run++) {
      const context = await browser.newContext({ viewport: { width: 1320, height: 780 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(() => {
        window.__apiTimings = {};
        const wrap = (prototype, name) => {
          const original = prototype[name];
          prototype[name] = function (...args) {
            const start = performance.now();
            try { return original.apply(this, args); }
            finally { const v = window.__apiTimings[name] ||= { calls: 0, ms: 0 }; v.calls++; v.ms += performance.now() - start; }
          };
        };
        wrap(CanvasRenderingContext2D.prototype, 'getImageData');
        for (const name of ['compileShader', 'linkProgram', 'getProgramParameter', 'texImage2D']) wrap(WebGLRenderingContext.prototype, name);
        window.__longTasks = [];
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) window.__longTasks.push({ start: e.startTime, duration: e.duration });
        }).observe({ type: 'longtask', buffered: true });
      });
      await page.goto('http://127.0.0.1:5173', { waitUntil: 'domcontentloaded' });
      await expect.poll(() => page.evaluate(() => window.__startup?.entries.some(e => e.name.startsWith('IntroScene:') && e.name.endsWith(':first-frame'))), { timeout: 120000 }).toBe(true);
      const intro = await page.evaluate(() => ({ entries: [...__startup.entries], api: structuredClone(__apiTimings) }));
      await page.evaluate(() => performance.mark('begin-input'));
      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => window.__startup?.entries.some(e => e.name.startsWith('GameScene:0:') && e.name.endsWith(':first-frame'))), { timeout: 120000 }).toBe(true);
      const result = await page.evaluate(() => ({
        entries: __startup.entries, api: __apiTimings, longTasks: __longTasks,
        begin: performance.getEntriesByName('begin-input')[0].startTime,
        resources: performance.getEntriesByType('resource').map(e => ({ name: e.name.replace(location.origin, ''), start: e.startTime, ms: e.duration, bytes: e.encodedBodySize, transfer: e.transferSize })),
        paints: performance.getEntriesByType('paint').map(e => ({ name: e.name, start: e.startTime })),
        renderer: game.renderer.type,
      }));
      result.intro = intro; result.errors = errors;
      results.push(result);
      writeFileSync(`performance-results/${label}.json`, JSON.stringify(results, null, 2));
      console.log(label, run, JSON.stringify({ entries: result.entries.filter(e => !e.name.endsWith('asset-process')), api: result.api, errors }));
      if (run === 0) await page.screenshot({ path: `performance-results/${label}-level1.png` });
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
