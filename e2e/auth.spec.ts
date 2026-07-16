import { test, expect } from '@playwright/test';

test('login page has email and password fields', async ({ page }) => {
  await page.goto('/auth/login');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByPlaceholder('your.email@example.com')).toBeVisible();
});

test('signup page loads for new trainers', async ({ page }) => {
  await page.goto('/auth/signup');
  await expect(page.locator('body')).toContainText(/sign up|create account|trainer/i);
});

test('client dashboard redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/client');
  await expect(page).toHaveURL(/auth\/login/);
});

test('trainer dashboard redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/trainer/dashboard');
  await expect(page).toHaveURL(/auth\/login/);
});
