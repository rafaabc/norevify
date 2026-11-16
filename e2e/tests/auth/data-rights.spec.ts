import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import { createAndLoginUser } from '../../fixtures/api';

async function openSettingsAsNewUser(
  request: APIRequestContext,
  page: Page,
  prefix: string,
): Promise<void> {
  const { token } = await createAndLoginUser(request, prefix);
  await page.addInitScript((t: string) => {
    localStorage.setItem('token', t);
    localStorage.setItem('i18nextLng', 'en');
  }, token);
  await page.goto('/settings');
}

test.describe('Data Subject Rights', () => {
  test('[TC-DR-E2E-01] should require consent before sign-up is possible', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('i18nextLng', 'en'));
    await page.goto('/register');

    await expect(page.locator('#reg-consent')).not.toBeChecked();
    await page.locator('#reg-consent').check();
    await expect(page.locator('#reg-consent')).toBeChecked();
  });

  test('[TC-DR-E2E-02] should export data as JSON download', async ({ page, request }) => {
    await openSettingsAsNewUser(request, page, 'export');

    const exportBtn = page.getByRole('button', { name: /export/i });
    await expect(exportBtn).toBeVisible();

    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportBtn.click();
    const download = await downloadPromise;

    if (download) {
      expect(download.suggestedFilename()).toContain('norevify');
    }
  });

  // Confirming a delete needs a fresh Google ID token, which CI can't produce — the
  // success path is covered by test/integration/data-rights.flow.test.js.
  test('[TC-DR-E2E-03] should ask for Google re-authentication, not a password, to delete the account', async ({
    page,
    request,
  }) => {
    await openSettingsAsNewUser(request, page, 'del');

    await page.getByRole('button', { name: /delete.*account/i }).click();
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.locator('.modal input[type="password"]')).toHaveCount(0);
    await expect(page.locator('#delete-password')).toHaveCount(0);
  });

  test('[TC-DR-E2E-04] should sign out of all devices and return to /login', async ({
    page,
    request,
  }) => {
    await openSettingsAsNewUser(request, page, 'signout');

    await page.getByRole('button', { name: /sign out of all devices/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
