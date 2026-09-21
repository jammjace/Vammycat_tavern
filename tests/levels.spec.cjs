const { test, expect } = require('@playwright/test');
const original = require('./fixtures/willowcross.json');

test('final map retains its configuration with the corrected sheltered spawn', async () => {
  const { level3 } = await import('../src/levels/level3.js');
  const { id, ...map } = level3;
  expect(id).toBe('willowcross');
  expect(map).toEqual(original);
});
