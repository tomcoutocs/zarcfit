import { test, expect } from '@playwright/test';

/**
 * QW-831: Full flow requires seeded trainer + client test accounts.
 * Set E2E_TRAINER_EMAIL, E2E_TRAINER_PASSWORD, E2E_CLIENT_EMAIL in CI to enable.
 */
const trainerEmail = process.env.E2E_TRAINER_EMAIL;
const trainerPassword = process.env.E2E_TRAINER_PASSWORD;

test.describe('Program assignment flow', () => {
  test.skip(!trainerEmail || !trainerPassword, 'Set E2E trainer credentials to run');

  test('trainer programs page loads when authenticated', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByPlaceholder('your.email@example.com').fill(trainerEmail!);
    await page.getByLabel(/^password$/i).fill(trainerPassword!);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await page.waitForURL(/trainer/);

    await page.goto('/trainer/programs');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test('client workout page requires auth', async ({ page }) => {
  await page.goto('/client/workout');
  await expect(page).toHaveURL(/auth\/login/);
});
