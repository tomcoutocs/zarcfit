import { test, expect } from '@playwright/test';

/**
 * QW-831b: Full assign → client sees program flow.
 * Requires seeded accounts in Supabase:
 *   E2E_TRAINER_EMAIL, E2E_TRAINER_PASSWORD
 *   E2E_CLIENT_EMAIL, E2E_CLIENT_PASSWORD (optional, for full flow)
 *   E2E_TEMPLATE_NAME (optional — defaults to first template)
 */
const trainerEmail = process.env.E2E_TRAINER_EMAIL;
const trainerPassword = process.env.E2E_TRAINER_PASSWORD;
const clientEmail = process.env.E2E_CLIENT_EMAIL;
const clientPassword = process.env.E2E_CLIENT_PASSWORD;
const templateName = process.env.E2E_TEMPLATE_NAME;

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/auth/login');
  await page.getByPlaceholder('your.email@example.com').fill(email);
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /sign in|log in/i }).click();
  await page.waitForURL(/\/(trainer|client)/);
}

test.describe('Program assignment flow', () => {
  test.skip(!trainerEmail || !trainerPassword, 'Set E2E trainer credentials to run');

  test('trainer can open programs and assign template to client', async ({ page }) => {
    await login(page, trainerEmail!, trainerPassword!);
    await page.goto('/trainer/programs');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const applyButton = page.getByRole('button', { name: /apply to client/i }).first();
    const hasTemplate = await applyButton.isVisible().catch(() => false);
    test.skip(!hasTemplate, 'No templates with clients available');

    await applyButton.click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const clientSelect = page.getByRole('combobox');
    await clientSelect.click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /apply plan/i }).click();
    await expect(page.getByText(/applied to client/i)).toBeVisible({ timeout: 15_000 });
  });

  test('full flow: trainer assigns → client sees program on workout page', async ({ page }) => {
    test.skip(!clientEmail || !clientPassword, 'Set E2E client credentials for full flow');

    await login(page, trainerEmail!, trainerPassword!);
    await page.goto('/trainer/programs');

    const applyButton = page.getByRole('button', { name: /apply to client/i }).first();
    test.skip(!(await applyButton.isVisible().catch(() => false)), 'No assignable templates');

    let assignedName = templateName;
    if (templateName) {
      const card = page.locator('.grid').filter({ hasText: templateName }).first();
      await card.getByRole('button', { name: /apply to client/i }).click();
    } else {
      assignedName = (await page.locator('[class*="CardTitle"]').first().textContent())?.trim();
      await applyButton.click();
    }

    await page.getByRole('combobox').click();
    const clientOption = page.getByRole('option', { name: new RegExp(clientEmail!.split('@')[0], 'i') });
    if (await clientOption.isVisible().catch(() => false)) {
      await clientOption.click();
    } else {
      await page.getByRole('option').first().click();
    }
    await page.getByRole('button', { name: /apply plan/i }).click();
    await expect(page.getByText(/applied to client/i)).toBeVisible({ timeout: 15_000 });

    await page.goto('/auth/login');
    await login(page, clientEmail!, clientPassword!);
    await page.goto('/client/workout');
    await expect(page).toHaveURL(/\/client\/workout/);

    if (assignedName) {
      await expect(page.getByText(assignedName, { exact: false })).toBeVisible({ timeout: 15_000 });
    } else {
      await expect(page.getByText(/program|workout|session/i).first()).toBeVisible();
    }
  });
});

test('client workout page requires auth', async ({ page }) => {
  await page.goto('/client/workout');
  await expect(page).toHaveURL(/auth\/login/);
});
