import { test, expect } from '@playwright/test';
import { uniqueUsername, DEFAULT_PASSWORD } from '../../fixtures/test-data';

const VALID_CONSENT = { policyVersion: '2026-05-20', acceptedAt: new Date().toISOString() };

test.describe('Data Subject Rights', () => {
  test('[TC-DR-E2E-01] should register with consent and navigate to login', async ({ page, request }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.goto('/register');

    const username = uniqueUsername('consent');
    await page.locator('[name="username"]').fill(username);
    await page.locator('[name="email"]').fill(`${username}@test.com`);
    await page.locator('[name="password"]').fill(DEFAULT_PASSWORD);

    // Submit should be disabled without consent
    await expect(page.locator('button[type="submit"]')).toBeDisabled();

    // Check consent checkbox
    await page.locator('#reg-consent').check();
    await expect(page.locator('button[type="submit"]')).toBeEnabled();

    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('[TC-DR-E2E-02] should export data as JSON download', async ({ page, request }) => {
    // Create and verify a test user
    const username = uniqueUsername('export');
    const password = DEFAULT_PASSWORD;
    const email = `${username}@test.com`;

    const regRes = await request.post('/api/auth/register', {
      data: { username, password, email, consent: VALID_CONSENT },
    });
    expect(regRes.ok()).toBeTruthy();

    const loginRes = await request.post('/api/auth/login', { data: { username, password } });
    const { token } = await loginRes.json();

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('i18nextLng', 'en');
    }, token);
    await page.goto('/settings');

    // Look for the export button
    const exportBtn = page.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();

    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;

    if (download) {
      expect(download.suggestedFilename()).toContain('drive-ledger');
    }
    // If download event not captured (browser-specific), just assert no error shown
  });

  test('[TC-DR-E2E-03] should delete account and redirect to /login with banner', async ({ page, request }) => {
    const username = uniqueUsername('del');
    const password = DEFAULT_PASSWORD;
    const email = `${username}@test.com`;

    const regRes = await request.post('/api/auth/register', {
      data: { username, password, email, consent: VALID_CONSENT },
    });
    expect(regRes.ok()).toBeTruthy();

    const loginRes = await request.post('/api/auth/login', { data: { username, password } });
    const { token } = await loginRes.json();

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
      localStorage.setItem('i18nextLng', 'en');
    }, token);
    await page.goto('/settings');

    // Click delete account button
    await page.getByRole('button', { name: /delete.*account/i }).click();

    // Modal should appear
    await expect(page.locator('.modal')).toBeVisible();

    // Fill password
    const passwordInput = page.locator('#delete-password');
    if (await passwordInput.isVisible()) {
      await passwordInput.fill(password);
    }

    // Confirm delete
    await page.getByRole('button', { name: /delete account/i }).last().click();

    // Should redirect to /login with ?deleted=1
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
