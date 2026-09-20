const { test, expect } = require('@playwright/test');
const original = require('./fixtures/willowcross.json');

test('final map retains every original configuration value', async () => {
  const { level3 } = await import('../src/levels/level3.js');
  const { id, ...map } = level3;
  expect(id).toBe('willowcross');
  expect(map).toEqual(original);
});
