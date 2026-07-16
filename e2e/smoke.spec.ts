import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('body')).toBeVisible();
});

test('login page loads', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
