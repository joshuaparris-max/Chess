import { expect, test } from '@playwright/test';

test('mobile board stays square without horizontal overflow', async ({ page }) => {
  await page.goto('/');
  const board = page.locator('.chess-board');
  const box = await board.boundingBox();
  expect(box).not.toBeNull();
  expect(Math.abs((box?.width ?? 0) - (box?.height ?? 0))).toBeLessThan(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test('choosing Black flips the board and lets the bot move first', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Your color').selectOption('b');
  await expect(page.getByText('You · Black')).toBeVisible();
  await expect.poll(async () => page.locator('ol li').count()).toBeGreaterThan(0);
});

test('timed game renders both drift-safe clocks', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Time control').selectOption('5+0');
  const clocks = page.getByLabel('Chess clocks');
  await expect(clocks).toBeVisible();
  await expect(clocks.getByText('White', { exact: true })).toBeVisible();
  await expect(clocks.getByText('Black', { exact: true })).toBeVisible();
});
