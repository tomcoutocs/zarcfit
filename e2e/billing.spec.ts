import { test, expect } from '@playwright/test';

test('plans page shows tier cards', async ({ page }) => {
  await page.goto('/main/plans');
  await expect(page.getByText('Starter')).toBeVisible();
  await expect(page.getByText('Growth')).toBeVisible();
  await expect(page.getByText('Pro')).toBeVisible();
});

test('plans page prompts signup when not logged in', async ({ page }) => {
  await page.goto('/main/plans');
  const subscribeButton = page.getByRole('button', { name: /subscribe|get started|choose/i }).first();
  if (await subscribeButton.isVisible()) {
    await subscribeButton.click();
    await expect(page).toHaveURL(/auth\/(signup|login)/);
  }
});

test('FAQ billing section mentions Stripe', async ({ page }) => {
  await page.goto('/main/faq');
  await expect(page.getByText(/Stripe/i)).toBeVisible();
});
