import { test, expect } from '@playwright/test';

/**
 * End-to-end smoke test: load the dashboard, apply a topic filter, and confirm a chart's
 * DOM updates in response — with no console errors thrown during the flow.
 */
test('applying a topic filter updates the charts with no console errors', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(err.message));

  await page.goto('/');

  // Wait for the initial data to load: the header shows the total insight count.
  const count = page.getByTestId('insights-count');
  await expect(count).toContainText('insights', { timeout: 30_000 });
  const initialText = await count.textContent();
  const initialTotal = Number(initialText.replace(/[^\d]/g, ''));
  expect(initialTotal).toBeGreaterThan(0);

  // Capture the Region chart's current SVG markup (a chart we expect to change).
  const regionCard = page.locator('section', { hasText: 'Insights by Region' });
  await expect(regionCard.locator('svg')).toBeVisible();
  const regionBefore = await regionCard.locator('svg').innerHTML();

  // Apply a topic filter: tick the "oil" topic checkbox (exact — 'oil' also appears in
  // other option labels like 'peak oil' and several source names).
  const oil = page.getByRole('checkbox', { name: 'oil', exact: true }).first();
  await expect(oil).toBeVisible({ timeout: 30_000 });
  // Use click() (not check()) — the controlled checkbox re-renders on the URL change, so
  // check()'s post-click state verification can read a detached node. We verify the effect
  // via the count/chart assertions below instead.
  await oil.click();

  // The header count must drop below the unfiltered total (a real filter took effect).
  await expect
    .poll(async () => Number((await count.textContent()).replace(/[^\d]/g, '')), {
      timeout: 30_000,
    })
    .toBeLessThan(initialTotal);

  // And at least one chart's DOM must update: the Region chart SVG changes with new data.
  await expect
    .poll(async () => regionCard.locator('svg').innerHTML(), { timeout: 30_000 })
    .not.toBe(regionBefore);

  // No console errors were thrown during the whole flow.
  expect(consoleErrors, `console errors: ${consoleErrors.join(' | ')}`).toHaveLength(0);
});
