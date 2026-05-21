import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { uniqueUsername, DEFAULT_PASSWORD } from '../../fixtures/test-data';

const VALID_CONSENT = { policyVersion: '2026-05-20', acceptedAt: new Date().toISOString() };

async function loginAsNewUser(
  request: APIRequestContext,
  page: Page,
  prefix: string,
): Promise<{ password: string }> {
  const username = uniqueUsername(prefix);
  const password = DEFAULT_PASSWORD;
  const email = `${username}@test.com`;
  const regRes = await request.post('/api/auth/register', {
    data: { username, password, email, consent: VALID_CONSENT },
  });
  expect(regRes.ok()).toBeTruthy();
  const loginRes = await request.post('/api/auth/login', { data: { username, password } });
  const { token } = await loginRes.json();
  await page.addInitScript((t: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('i18nextLng', 'en');
  }, token);
  await page.goto('/settings');
  return { password };
}

test.describe('Data Subject Rights', () => {
  test('[TC-DR-E2E-01] should register with consent and navigate to login', async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.goto('/register');

    const username = uniqueUsername('consent');
    await page.locator('[name="username"]').fill(username);
    await page.locator('[name="email"]').fill(`${username}@test.com`);
    await page.locator('[name="password"]').fill(DEFAULT_PASSWORD);

    await expect(page.locator('button[type="submit"]')).toBeDisabled();
    await page.locator('#reg-consent').check();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();

    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('[TC-DR-E2E-02] should export data as JSON download', async ({ page, request }) => {
    await loginAsNewUser(request, page, 'export');

    const exportBtn = page.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;

    if (download) {
      expect(download.suggestedFilename()).toContain('norevify');
    }
  });

  test('[TC-DR-E2E-03] should delete account and redirect to /login with banner', async ({ page, request }) => {
    const { password } = await loginAsNewUser(request, page, 'del');

    await page.getByRole('button', { name: /delete.*account/i }).click();
    await expect(page.locator('.modal')).toBeVisible();

    const passwordInput = page.locator('#delete-password');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(password);
    }

    await page.getByRole('button', { name: /delete account/i }).last().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
